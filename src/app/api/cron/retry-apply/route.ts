import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_RETRIES = 3;
const STUCK_THRESHOLD_MINUTES = 10;

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const popebotUrl = process.env.POPEBOT_URL;
  const popebotKey = process.env.POPEBOT_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!popebotUrl || !popebotKey || !supabaseUrl || !supabaseKey) {
    console.error('[retry-apply] Missing env vars');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60000).toISOString();

  // Find jobs that are stuck in queued (failed apply) or applying (never completed)
  const { data: stuckJobs, error: queryError } = await supabase
    .from('co_jobs')
    .select('*')
    .or(`status.eq.queued,status.eq.applying`)
    .lt('retry_count', MAX_RETRIES)
    .or(`last_attempt_at.is.null,last_attempt_at.lt.${cutoff}`)
    .order('created_at', { ascending: true })
    .limit(5); // Process max 5 per cron run

  if (queryError) {
    console.error('[retry-apply] Query error:', queryError.message);
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  if (!stuckJobs || stuckJobs.length === 0) {
    return NextResponse.json({ message: 'No stuck jobs', retried: 0 });
  }

  console.log(`[retry-apply] Found ${stuckJobs.length} stuck jobs`);

  // Fetch profile once
  const { data: profile } = await supabase
    .from('co_profiles')
    .select('name, resume_path, resume_filename')
    .limit(1)
    .single();

  let resumeUrl = '';
  if (profile?.resume_path) {
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(profile.resume_path);
    resumeUrl = urlData.publicUrl;
  }

  const results: Array<{ jobId: string; status: string; error?: string }> = [];

  for (const job of stuckJobs) {
    const previousStatus = job.status;

    // Log retry attempt
    await supabase.from('co_job_logs').insert({
      job_id: job.id,
      action: 'retry_triggered',
      details: `Retry #${(job.retry_count || 0) + 1}. Previous status: ${previousStatus}. Last error: ${job.last_error || 'none'}`,
      status_before: previousStatus,
      status_after: 'applying',
    });

    // Mark as applying
    await supabase
      .from('co_jobs')
      .update({
        status: 'applying',
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    try {
      const candidateName = (profile?.name as string) || 'the candidate';
      const resumeFilename = (profile?.resume_filename as string) || 'resume.pdf';
      const resumeInstruction = resumeUrl
        ? `\n\nResume to upload: ${resumeUrl}\nResume filename: ${resumeFilename}\nFirst, download the resume from that URL, then upload it during the application process.`
        : '\n\nNo resume file is available. Fill in all fields manually using the candidate info above.';

      const res = await fetch(`${popebotUrl}/api/create-agent-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': popebotKey,
        },
        body: JSON.stringify({
          job: `Apply to this job on behalf of ${candidateName}:\n\nTitle: ${job.title}\nCompany: ${job.company}\nURL: ${job.url}\nSource: ${job.source}\nLocation: ${job.location}${resumeInstruction}\n\nUse Playwright to navigate to the job URL and complete the application. If it's a LinkedIn Easy Apply, use the Easy Apply flow. If it's Indeed, use the Indeed Apply flow. Upload the resume and fill in all required fields.`,
          metadata: {
            type: 'job-apply',
            jobId: job.id,
            source: job.source,
            url: job.url,
            resumeUrl: resumeUrl || undefined,
            isRetry: true,
            retryCount: (job.retry_count || 0) + 1,
          },
        }),
      });

      const responseText = await res.text();

      if (!res.ok) {
        const errorMsg = `ThePopeBot ${res.status}: ${responseText.slice(0, 500)}`;

        await supabase.from('co_jobs').update({
          status: 'queued',
          last_error: errorMsg,
          retry_count: (job.retry_count || 0) + 1,
        }).eq('id', job.id);

        await supabase.from('co_job_logs').insert({
          job_id: job.id,
          action: 'apply_failed',
          details: errorMsg,
          status_before: 'applying',
          status_after: 'queued',
        });

        results.push({ jobId: job.id, status: 'failed', error: errorMsg });
      } else {
        let result: Record<string, unknown> = {};
        try { result = JSON.parse(responseText); } catch { result = { raw: responseText }; }
        const agentJobId = (result.id as string) || '';

        await supabase.from('co_jobs').update({
          last_error: null,
        }).eq('id', job.id);

        await supabase.from('co_job_logs').insert({
          job_id: job.id,
          action: 'apply_success',
          details: `Agent job created: ${agentJobId}`,
          status_before: 'applying',
          status_after: 'applying',
          popebot_job_id: agentJobId,
        });

        results.push({ jobId: job.id, status: 'success' });
      }
    } catch (err) {
      const errorMsg = `Network error: ${err instanceof Error ? err.message : String(err)}`;

      await supabase.from('co_jobs').update({
        status: 'queued',
        last_error: errorMsg,
        retry_count: (job.retry_count || 0) + 1,
      }).eq('id', job.id);

      await supabase.from('co_job_logs').insert({
        job_id: job.id,
        action: 'apply_failed',
        details: errorMsg,
        status_before: 'applying',
        status_after: 'queued',
      });

      results.push({ jobId: job.id, status: 'failed', error: errorMsg });
    }

    // Brief pause between jobs to avoid hammering ThePopeBot
    await new Promise(r => setTimeout(r, 2000));
  }

  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  };

  console.log(`[retry-apply] Done:`, JSON.stringify(summary));
  return NextResponse.json(summary);
}
