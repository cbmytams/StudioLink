insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'mission-files',
  'mission-files',
  false,
  524288000,
  array[
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
where not exists (
  select 1
  from storage.buckets
  where id = 'mission-files'
);

update storage.buckets
set public = false,
    file_size_limit = 524288000,
    allowed_mime_types = array[
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ]::text[]
where id = 'mission-files';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'delivery-files',
  'delivery-files',
  false,
  524288000,
  array[
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'application/zip',
    'application/x-zip-compressed',
    'application/pdf'
  ]::text[]
where not exists (
  select 1
  from storage.buckets
  where id = 'delivery-files'
);

update storage.buckets
set public = false,
    file_size_limit = 524288000,
    allowed_mime_types = array[
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf'
    ]::text[]
where id = 'delivery-files';

drop policy if exists "Studio: upload mission file" on storage.objects;
create policy "Studio: upload mission file"
on storage.objects
for insert
with check (
  bucket_id = 'mission-files'
  and exists (
    select 1
    from public.missions as m
    where m.id::text = (storage.foldername(name))[1]
      and m.studio_id = auth.uid()
  )
);

drop policy if exists "Candidates: download mission file" on storage.objects;
create policy "Candidates: download mission file"
on storage.objects
for select
using (
  bucket_id = 'mission-files'
  and (
    exists (
      select 1
      from public.missions as m
      where m.id::text = (storage.foldername(name))[1]
        and m.studio_id = auth.uid()
    )
    or exists (
      select 1
      from public.applications as a
      join public.missions as m
        on m.id = a.mission_id
      where m.id::text = (storage.foldername(name))[1]
        and a.pro_id = auth.uid()
    )
  )
);

drop policy if exists "Studio: delete mission file" on storage.objects;
create policy "Studio: delete mission file"
on storage.objects
for delete
using (
  bucket_id = 'mission-files'
  and exists (
    select 1
    from public.missions as m
    where m.id::text = (storage.foldername(name))[1]
      and m.studio_id = auth.uid()
  )
);

drop policy if exists "Pro: upload delivery file" on storage.objects;
create policy "Pro: upload delivery file"
on storage.objects
for insert
with check (
  bucket_id = 'delivery-files'
  and exists (
    select 1
    from public.sessions as s
    where s.id::text = (storage.foldername(name))[1]
      and s.pro_id = auth.uid()
  )
);

drop policy if exists "Session participants: download delivery file" on storage.objects;
create policy "Session participants: download delivery file"
on storage.objects
for select
using (
  bucket_id = 'delivery-files'
  and exists (
    select 1
    from public.sessions as s
    where s.id::text = (storage.foldername(name))[1]
      and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
  )
);

drop policy if exists "Pro: delete delivery file" on storage.objects;
create policy "Pro: delete delivery file"
on storage.objects
for delete
using (
  bucket_id = 'delivery-files'
  and exists (
    select 1
    from public.sessions as s
    where s.id::text = (storage.foldername(name))[1]
      and s.pro_id = auth.uid()
  )
);

create table if not exists public.mission_files (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_type text not null check (file_type in ('reference', 'delivery')),
  file_url text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz default now()
);

alter table public.mission_files
  add column if not exists session_id uuid references public.sessions(id) on delete cascade,
  add column if not exists file_size bigint,
  add column if not exists mime_type text;

create index if not exists idx_mission_files_mission_id on public.mission_files(mission_id);
create index if not exists idx_mission_files_session_id on public.mission_files(session_id);

alter table public.mission_files enable row level security;

drop policy if exists "Participants: select mission files" on public.mission_files;
create policy "Participants: select mission files"
on public.mission_files
for select
using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.missions as m
    where m.id = mission_files.mission_id
      and m.studio_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications as a
    where a.mission_id = mission_files.mission_id
      and a.pro_id = auth.uid()
  )
  or exists (
    select 1
    from public.sessions as s
    where s.id = mission_files.session_id
      and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
  )
);

drop policy if exists "Uploader: insert own file" on public.mission_files;
create policy "Uploader: insert own file"
on public.mission_files
for insert
with check (auth.uid() = uploaded_by);

drop policy if exists "Uploader: delete own file" on public.mission_files;
create policy "Uploader: delete own file"
on public.mission_files
for delete
using (auth.uid() = uploaded_by);
