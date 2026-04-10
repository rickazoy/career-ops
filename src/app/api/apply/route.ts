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

  // Mark job as applying
  await supabase
    .from('co_jobs')
    .update({ status: 'applying' })
    .eq('id', jobId);

  // Trigger ThePopeBot agent job
  try {
    const res = await fetch(`${popebotUrl}/api/create-agent-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': popebotKey,
      },
      body: JSON.stringify({
        prompt: `Apply to this job:\n\nTitle: ${job.title}\nCompany: ${job.company}\nURL: ${job.url}\nSource: ${job.source}\nLocation: ${job.location}\n\nUse Playwright to navigate to the job URL and complete the application. If it's a LinkedIn Easy Apply, use the Easy Apply flow. If it's Indeed, use the Indeed Apply flow. Upload the most relevant resume and fill in all required fields.`,
        metadata: {
          type: 'job-apply',
          jobId: job.id,
          source: job.source,
          url: job.url,
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
