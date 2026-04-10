-- Add resume file columns to co_profiles
alter table co_profiles add column if not exists resume_path text;
alter table co_profiles add column if not exists resume_filename text;
alter table co_profiles add column if not exists resume_updated_at timestamptz;

-- Create storage bucket for resumes (run in Supabase dashboard SQL editor)
-- Note: Storage bucket creation via SQL requires the storage schema
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload/read resumes
create policy "Authenticated users can upload resumes"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes');

create policy "Authenticated users can read resumes"
  on storage.objects for select to authenticated
  using (bucket_id = 'resumes');

create policy "Authenticated users can update resumes"
  on storage.objects for update to authenticated
  using (bucket_id = 'resumes');

create policy "Authenticated users can delete resumes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'resumes');

-- Public read access for ThePopeBot to download during apply
create policy "Public read access for resumes"
  on storage.objects for select to anon
  using (bucket_id = 'resumes');
