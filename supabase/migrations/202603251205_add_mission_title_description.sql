alter table public.missions
  add column if not exists title text,
  add column if not exists description text;

update public.missions
set title = coalesce(title, nullif(service_type, ''), 'Mission')
where title is null;
