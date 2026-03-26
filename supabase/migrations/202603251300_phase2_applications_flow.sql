alter table public.applications
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists cover_letter text;

update public.applications
set created_at = coalesce(created_at, applied_at, now())
where created_at is null;

update public.applications
set updated_at = coalesce(updated_at, created_at, applied_at, now())
where updated_at is null;

update public.applications
set cover_letter = coalesce(cover_letter, message, '')
where cover_letter is null;

update public.applications
set status = 'accepted'
where status::text = 'selected';

create index if not exists idx_applications_mission_id on public.applications(mission_id);
create index if not exists idx_applications_pro_id on public.applications(pro_id);
create index if not exists idx_applications_mission_pending on public.applications(mission_id, status);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_applications on public.applications;
create trigger set_updated_at_applications
  before update on public.applications
  for each row execute function public.update_updated_at_column();

alter table public.applications enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'applications'
  loop
    execute format('drop policy if exists %I on public.applications', existing_policy.policyname);
  end loop;
end $$;

create policy "Pro: select own applications"
  on public.applications
  for select
  using (auth.uid() = pro_id);

create policy "Studio: select applications for own missions"
  on public.applications
  for select
  using (
    exists (
      select 1
      from public.missions m
      where m.id = applications.mission_id
        and m.studio_id = auth.uid()
    )
  );

create policy "Pro: insert own application"
  on public.applications
  for insert
  with check (auth.uid() = pro_id);

create policy "Studio: update application status"
  on public.applications
  for update
  using (
    exists (
      select 1
      from public.missions m
      where m.id = applications.mission_id
        and m.studio_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.missions m
      where m.id = applications.mission_id
        and m.studio_id = auth.uid()
    )
    and status::text in ('accepted', 'rejected')
  );

create policy "Pro: delete own pending application"
  on public.applications
  for delete
  using (auth.uid() = pro_id and status::text = 'pending');

alter table public.missions
  add column if not exists applications_count integer default 0;

update public.missions m
set applications_count = pending.pending_count
from (
  select mission_id, count(*)::integer as pending_count
  from public.applications
  where status::text = 'pending'
  group by mission_id
) pending
where pending.mission_id = m.id;

update public.missions
set applications_count = 0
where applications_count is null;

create or replace function public.accept_application(p_application_id uuid)
returns table (
  application_id uuid,
  mission_id uuid,
  pro_id uuid,
  status public.application_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications%rowtype;
begin
  select *
  into v_application
  from public.applications a
  where a.id = p_application_id;

  if not found then
    raise exception 'Application introuvable';
  end if;

  if not exists (
    select 1
    from public.missions m
    where m.id = v_application.mission_id
      and m.studio_id = auth.uid()
  ) then
    raise exception 'Action non autorisée';
  end if;

  update public.applications
  set status = 'accepted'
  where id = p_application_id;

  update public.applications
  set status = 'rejected'
  where mission_id = v_application.mission_id
    and id <> p_application_id
    and status::text = 'pending';

  update public.missions
  set selected_pro_id = v_application.pro_id,
      status = 'in_progress',
      applications_count = (
        select count(*)::integer
        from public.applications a2
        where a2.mission_id = v_application.mission_id
          and a2.status::text = 'pending'
      )
  where id = v_application.mission_id;

  return query
  select a.id, a.mission_id, a.pro_id, a.status
  from public.applications a
  where a.id = p_application_id;
end;
$$;

create or replace function public.reject_application(p_application_id uuid)
returns table (
  application_id uuid,
  mission_id uuid,
  pro_id uuid,
  status public.application_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications%rowtype;
begin
  select *
  into v_application
  from public.applications a
  where a.id = p_application_id;

  if not found then
    raise exception 'Application introuvable';
  end if;

  if not exists (
    select 1
    from public.missions m
    where m.id = v_application.mission_id
      and m.studio_id = auth.uid()
  ) then
    raise exception 'Action non autorisée';
  end if;

  update public.applications
  set status = 'rejected'
  where id = p_application_id;

  update public.missions
  set applications_count = (
    select count(*)::integer
    from public.applications a2
    where a2.mission_id = v_application.mission_id
      and a2.status::text = 'pending'
  )
  where id = v_application.mission_id;

  return query
  select a.id, a.mission_id, a.pro_id, a.status
  from public.applications a
  where a.id = p_application_id;
end;
$$;

grant execute on function public.accept_application(uuid) to authenticated;
grant execute on function public.reject_application(uuid) to authenticated;
