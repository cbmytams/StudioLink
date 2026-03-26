alter table public.applications
  add column if not exists created_at timestamptz default now(),
  add column if not exists cover_letter text,
  add column if not exists proposed_rate integer;

update public.applications
set created_at = coalesce(created_at, applied_at)
where created_at is null and applied_at is not null;

update public.applications
set cover_letter = coalesce(cover_letter, message)
where cover_letter is null and message is not null;
