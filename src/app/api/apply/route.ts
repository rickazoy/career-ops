import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const popebotUrl = process.env.POPEBOT_URL;
  const popebotKey = process.env.POPEBOT_API_KEY;

  if (!popebotUrl || !popebotKey) {
    return NextResponse.json(
      { error: 'ThePopeBot is not configured' },
      { status: 503 }
    );
  }

  const { jobId } = await request.json();
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  // Fetch the job from Supabase
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

  const { data: job, error: fetchError } = await supabase
    .from('co_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Fetch candidate's resume URL from profile
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

  // Mark job as applying
  await supabase
    .from('co_jobs')
    .update({ status: 'applying' })
    .eq('id', jobId);

  // Trigger ThePopeBot agent job
  try {
    const resumeInstruction = resumeUrl
      ? `\n\nResume to upload: ${resumeUrl}\nResume filename: ${profile?.resume_filename || 'resume.pdf'}\nFirst, download the resume from that URL, then upload it during the application process.`
      : '\n\nNo resume file is available. Fill in all fields manually using the candidate info above.';

    const candidateName = profile?.name || 'the candidate';

    const res = await fetch(`${popebotUrl}/api/create-agent-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': popebotKey,
      },
      body: JSON.stringify({
        prompt: `Apply to this job on behalf of ${candidateName}:\n\nTitle: ${job.title}\nCompany: ${job.company}\nURL: ${job.url}\nSource: ${job.source}\nLocation: ${job.location}${resumeInstruction}\n\nUse Playwright to navigate to the job URL and complete the application. If it's a LinkedIn Easy Apply, use the Easy Apply flow. If it's Indeed, use the Indeed Apply flow. Upload the resume and fill in all required fields.`,
        metadata: {
          type: 'job-apply',
          jobId: job.id,
          source: job.source,
          url: job.url,
          resumeUrl: resumeUrl || undefined,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      // Revert status on failure
      await supabase
        .from('co_jobs')
        .update({ status: 'queued' })
        .eq('id', jobId);

      return NextResponse.json(
        { error: `ThePopeBot returned ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    const result = await res.json();
    return NextResponse.json({ success: true, agentJobId: result.id });
  } catch (err) {
    // Revert status on network error
    await supabase
      .from('co_jobs')
      .update({ status: 'queued' })
      .eq('id', jobId);

    return NextResponse.json(
      { error: `Failed to reach ThePopeBot: ${err}` },
      { status: 502 }
    );
  }
}
