-- Track every apply attempt with full error details
create table co_job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references co_jobs(id) on delete cascade,
  action text not null,  -- 'apply_triggered', 'apply_success', 'apply_failed', 'retry_triggered', 'status_changed'
  status_before text,
  status_after text,
  details text,          -- error message, response body, etc
  popebot_job_id text,   -- agent job ID from ThePopeBot response
  created_at timestamptz not null default now()
);

create index co_job_logs_job_id_idx on co_job_logs(job_id);
create index co_job_logs_created_at_idx on co_job_logs(created_at desc);

-- RLS
alter table co_job_logs enable row level security;

create policy "Authenticated users can read job logs"
  on co_job_logs for select to authenticated using (true);

create policy "Authenticated users can insert job logs"
  on co_job_logs for insert to authenticated with check (true);

create policy "Service role full access on job logs"
  on co_job_logs for all to service_role using (true);

-- Add retry tracking columns to co_jobs
alter table co_jobs add column if not exists retry_count integer not null default 0;
alter table co_jobs add column if not exists last_error text;
alter table co_jobs add column if not exists last_attempt_at timestamptz;
