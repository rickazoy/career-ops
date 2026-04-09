-- Career Ops: Initial Schema
-- Run this in your Supabase SQL editor

-- ============================================================================
-- Profiles
-- ============================================================================
create table if not exists co_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null default '',
  email text not null default '',
  phone text,
  location text not null default '',
  linkedin text,
  portfolio text,
  github text,
  headline text not null default '',
  exit_story text not null default '',
  superpowers text[] default '{}',
  target_roles text[] default '{}',
  archetypes jsonb default '[]',
  compensation jsonb default '{"target_range": "", "currency": "USD", "minimum": 0}'
);

-- ============================================================================
-- Job Evaluations
-- ============================================================================
create table if not exists co_evaluations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  company text not null,
  role text not null,
  url text,
  jd_text text not null,
  scores jsonb not null,
  global_score numeric(3,1) not null,
  blocks jsonb not null,
  verdict text not null check (verdict in ('strong_match', 'good_match', 'decent', 'pass')),
  status text not null default 'evaluated'
    check (status in ('evaluated', 'applied', 'responded', 'interview', 'offer', 'rejected', 'discarded', 'skip')),
  report_markdown text not null default '',
  pdf_generated boolean not null default false
);

-- Index for dashboard queries
create index if not exists idx_co_evaluations_status on co_evaluations(status);
create index if not exists idx_co_evaluations_score on co_evaluations(global_score desc);
create index if not exists idx_co_evaluations_created on co_evaluations(created_at desc);

-- ============================================================================
-- Interview Prep
-- ============================================================================
create table if not exists co_interview_preps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  evaluation_id uuid references co_evaluations(id) on delete set null,
  company text not null,
  role text not null,
  rounds jsonb default '[]',
  stories jsonb default '[]',
  intel text not null default '',
  do_list text[] default '{}',
  dont_list text[] default '{}'
);

create index if not exists idx_co_interview_preps_eval on co_interview_preps(evaluation_id);

-- ============================================================================
-- STAR Story Bank
-- ============================================================================
create table if not exists co_stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  situation text not null,
  task text not null,
  action text not null,
  result text not null,
  tags text[] default '{}'
);

-- ============================================================================
-- Portal Scanner Config
-- ============================================================================
create table if not exists co_portals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  careers_url text not null,
  category text not null default 'Custom',
  greenhouse_id text,
  enabled boolean not null default true
);

-- ============================================================================
-- Updated_at trigger
-- ============================================================================
create or replace function co_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger co_profiles_updated_at
  before update on co_profiles
  for each row execute function co_update_updated_at();
