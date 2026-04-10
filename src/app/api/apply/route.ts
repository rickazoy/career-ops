import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

async function log(
  supabase: SupabaseClient,
  jobId: string,
  action: string,
  details: string,
  extra?: { status_before?: string; status_after?: string; popebot_job_id?: string }
) {
  await supabase.from('co_job_logs').insert({
    job_id: jobId,
    action,
    details,
    status_before: extra?.status_before || null,
    status_after: extra?.status_after || null,
    popebot_job_id: extra?.popebot_job_id || null,
  });
  console.log(`[apply] job=${jobId} action=${action} ${details}`);
}

function buildPrompt(job: Record<string, unknown>, profile: Record<string, unknown> | null, resumeUrl: string) {
  const candidateName = (profile?.name as string) || 'the candidate';
  const resumeFilename = (profile?.resume_filename as string) || 'resume.pdf';

  const resumeInstruction = resumeUrl
    ? `\n\nResume to upload: ${resumeUrl}\nResume filename: ${resumeFilename}\nFirst, download the resume from that URL, then upload it during the application process.`
    : '\n\nNo resume file is available. Fill in all fields manually using the candidate info above.';

  return `Apply to this job on behalf of ${candidateName}:\n\nTitle: ${job.title}\nCompany: ${job.company}\nURL: ${job.url}\nSource: ${job.source}\nLocation: ${job.location}${resumeInstruction}\n\nUse Playwright to navigate to the job URL and complete the application. If it's a LinkedIn Easy Apply, use the Easy Apply flow. If it's Indeed, use the Indeed Apply flow. Upload the resume and fill in all required fields.`;
}

export async function POST(request: NextRequest) {
  const popebotUrl = process.env.POPEBOT_URL;
  const popebotKey = process.env.POPEBOT_API_KEY;

  if (!popebotUrl || !popebotKey) {
    const missing = [];
    if (!popebotUrl) missing.push('POPEBOT_URL');
    if (!popebotKey) missing.push('POPEBOT_API_KEY');
    console.error(`[apply] Missing env vars: ${missing.join(', ')}`);
    return NextResponse.json(
      { error: `ThePopeBot not configured. Missing: ${missing.join(', ')}` },
      { status: 503 }
    );
  }

  const { jobId } = await request.json();
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  // Fetch the job
  const { data: job, error: fetchError } = await supabase
    .from('co_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    console.error(`[apply] Job not found: ${jobId}`, fetchError?.message);
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Fetch candidate profile + resume
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

  const previousStatus = job.status;

  // Mark as applying
  await supabase
    .from('co_jobs')
    .update({
      status: 'applying',
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  await log(supabase, jobId, 'apply_triggered', `Sending to ThePopeBot at ${popebotUrl}. Resume: ${resumeUrl ? 'yes' : 'no'}`, {
    status_before: previousStatus,
    status_after: 'applying',
  });

  // Call ThePopeBot
  try {
    const prompt = buildPrompt(job, profile, resumeUrl);

    const res = await fetch(`${popebotUrl}/api/create-agent-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': popebotKey,
      },
      body: JSON.stringify({
        prompt,
        metadata: {
          type: 'job-apply',
          jobId: job.id,
          source: job.source,
          url: job.url,
          resumeUrl: resumeUrl || undefined,
        },
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      const errorMsg = `ThePopeBot returned ${res.status}: ${responseText}`;

      await supabase
        .from('co_jobs')
        .update({
          status: 'queued',
          last_error: errorMsg,
          retry_count: (job.retry_count || 0) + 1,
        })
        .eq('id', jobId);

      await log(supabase, jobId, 'apply_failed', errorMsg, {
        status_before: 'applying',
        status_after: 'queued',
      });

      return NextResponse.json({ error: errorMsg }, { status: 502 });
    }

    // Parse successful response
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    const agentJobId = (result.id as string) || (result.jobId as string) || '';

    await log(supabase, jobId, 'apply_success', `Agent job created: ${agentJobId}`, {
      status_before: 'applying',
      status_after: 'applying',
      popebot_job_id: agentJobId,
    });

    // Clear error on success
    await supabase
      .from('co_jobs')
      .update({ last_error: null })
      .eq('id', jobId);

    return NextResponse.json({ success: true, agentJobId });
  } catch (err) {
    const errorMsg = `Network error: ${err instanceof Error ? err.message : String(err)}`;

    await supabase
      .from('co_jobs')
      .update({
        status: 'queued',
        last_error: errorMsg,
        retry_count: (job.retry_count || 0) + 1,
      })
      .eq('id', jobId);

    await log(supabase, jobId, 'apply_failed', errorMsg, {
      status_before: 'applying',
      status_after: 'queued',
    });

    return NextResponse.json({ error: errorMsg }, { status: 502 });
  }
}
