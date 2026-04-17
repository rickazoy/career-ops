import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Callback webhook for ThePopeBot to report job application results.
 * Called by the agent at the end of the apply task.
 *
 * POST /api/apply-callback
 * Body: { jobId, status, summary, error? }
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const jobId = body.jobId as string || body.job_id as string;
  const status = body.status as string; // 'success', 'failed', 'partial'
  const summary = body.summary as string || '';
  const errorMsg = body.error as string || '';

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  console.log(`[apply-callback] job=${jobId} status=${status} summary=${summary?.slice(0, 100)}`);

  // Map ThePopeBot result to job status
  let newStatus: string;
  if (status === 'success') {
    newStatus = 'applied';
  } else if (status === 'failed') {
    newStatus = 'queued'; // Allow retry
  } else {
    newStatus = 'applied'; // partial = still counts
  }

  // Update the job
  const updates: Record<string, unknown> = {
    last_error: status === 'failed' ? (errorMsg || summary) : null,
  };

  if (newStatus === 'applied') {
    updates.status = 'applied';
    updates.applied_at = new Date().toISOString();
  } else {
    updates.status = newStatus;
  }

  await supabase
    .from('co_jobs')
    .update(updates)
    .eq('id', jobId);

  // Log the callback
  await supabase.from('co_job_logs').insert({
    job_id: jobId,
    action: status === 'success' ? 'apply_confirmed' : status === 'failed' ? 'apply_rejected' : 'apply_partial',
    details: summary || errorMsg || `Callback received: ${status}`,
    status_before: 'applying',
    status_after: newStatus,
  });

  return NextResponse.json({ received: true, newStatus });
}
