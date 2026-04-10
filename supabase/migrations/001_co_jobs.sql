create table co_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  company text not null,
  location text not null default '',
  url text not null,
  source text not null default 'other',
  description text not null default '',
  salary_range text,
  job_type text,
  remote_type text,
  posted_at timestamptz,
  match_score numeric,
  status text not null default 'new',
  notes text,
  applied_at timestamptz,
  evaluation_id uuid references co_evaluations(id) on delete set null,

  constraint co_jobs_source_check check (source in ('linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'other')),
  constraint co_jobs_status_check check (status in ('new', 'reviewed', 'queued', 'applying', 'applied', 'rejected', 'skipped')),
  constraint co_jobs_remote_check check (remote_type is null or remote_type in ('remote', 'hybrid', 'onsite'))
);

-- Indexes for common query patterns
create index co_jobs_status_idx on co_jobs(status);
create index co_jobs_source_idx on co_jobs(source);
create index co_jobs_created_at_idx on co_jobs(created_at desc);
create index co_jobs_company_idx on co_jobs(company);

-- Prevent duplicate job listings from the same source
create unique index co_jobs_url_unique on co_jobs(url);

-- RLS: allow authenticated users full access
alter table co_jobs enable row level security;

create policy "Authenticated users can read jobs"
  on co_jobs for select to authenticated using (true);

create policy "Authenticated users can insert jobs"
  on co_jobs for insert to authenticated with check (true);

create policy "Authenticated users can update jobs"
  on co_jobs for update to authenticated using (true);

create policy "Authenticated users can delete jobs"
  on co_jobs for delete to authenticated using (true);

-- Also allow service_role (for ThePopeBot inserting via service key)
create policy "Service role full access"
  on co_jobs for all to service_role using (true);
