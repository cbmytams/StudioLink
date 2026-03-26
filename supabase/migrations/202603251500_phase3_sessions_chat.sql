create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  studio_id uuid not null references public.profiles(id) on delete cascade,
  pro_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (mission_id)
);

alter table public.messages
  add column if not exists session_id uuid references public.sessions(id) on delete cascade,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists is_read boolean default false;

update public.messages
set is_read = coalesce(is_read, read, read_at is not null, false);

create index if not exists idx_messages_session_id on public.messages(session_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_sessions_studio_id on public.sessions(studio_id);
create index if not exists idx_sessions_pro_id on public.sessions(pro_id);
create index if not exists idx_sessions_mission_id on public.sessions(mission_id);

drop trigger if exists set_updated_at_sessions on public.sessions;
create trigger set_updated_at_sessions
  before update on public.sessions
  for each row execute function public.update_updated_at_column();

insert into public.sessions (mission_id, studio_id, pro_id, application_id, status, created_at, updated_at)
select
  m.id,
  m.studio_id,
  a.pro_id,
  a.id,
  case
    when m.status::text = 'completed' then 'completed'
    when m.status::text = 'cancelled' then 'cancelled'
    else 'confirmed'
  end,
  coalesce(a.created_at, now()),
  coalesce(a.updated_at, a.created_at, now())
from public.missions as m
join public.applications as a
  on a.mission_id = m.id
where a.status::text = 'accepted'
on conflict (mission_id) do nothing;

alter table public.sessions enable row level security;

drop policy if exists "Studio: select own sessions" on public.sessions;
create policy "Studio: select own sessions"
  on public.sessions
  for select
  using (auth.uid() = studio_id);

drop policy if exists "Pro: select own sessions" on public.sessions;
create policy "Pro: select own sessions"
  on public.sessions
  for select
  using (auth.uid() = pro_id);

alter table public.messages enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
  loop
    execute format('drop policy if exists %I on public.messages', existing_policy.policyname);
  end loop;
end $$;

create policy "Participants: select messages of own chat"
  on public.messages
  for select
  using (
    (
      messages.session_id is not null
      and exists (
        select 1
        from public.sessions as s
        where s.id = messages.session_id
          and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
      )
    )
    or (
      messages.conversation_id is not null
      and exists (
        select 1
        from public.conversations as c
        where c.id = messages.conversation_id
          and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
      )
    )
  );

create policy "Participants: insert message in own chat"
  on public.messages
  for insert
  with check (
    auth.uid() = sender_id
    and (
      (
        messages.session_id is not null
        and exists (
          select 1
          from public.sessions as s
          where s.id = messages.session_id
            and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
        )
      )
      or (
        messages.conversation_id is not null
        and exists (
          select 1
          from public.conversations as c
          where c.id = messages.conversation_id
            and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
        )
      )
    )
  );

create or replace function public.mark_session_messages_as_read(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer := 0;
begin
  if not exists (
    select 1
    from public.sessions as s
    where s.id = p_session_id
      and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
  ) then
    raise exception 'Action non autorisée';
  end if;

  update public.messages as m
  set is_read = true,
      read = true,
      read_at = coalesce(m.read_at, now())
  where m.session_id = p_session_id
    and m.sender_id <> auth.uid()
    and coalesce(m.is_read, false) = false;

  get diagnostics v_updated_count = row_count;
  return v_updated_count;
end;
$$;

grant execute on function public.mark_session_messages_as_read(uuid) to authenticated;

create or replace function public.get_or_create_session_for_mission(p_mission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_mission public.missions%rowtype;
  v_application public.applications%rowtype;
begin
  select *
  into v_mission
  from public.missions as m
  where m.id = p_mission_id;

  if not found then
    raise exception 'Mission introuvable';
  end if;

  select *
  into v_application
  from public.applications as a
  where a.mission_id = p_mission_id
    and a.status::text = 'accepted'
  order by a.updated_at desc nulls last, a.created_at desc nulls last
  limit 1;

  if not found then
    raise exception 'Aucune candidature acceptée pour cette mission';
  end if;

  if auth.uid() <> v_mission.studio_id and auth.uid() <> v_application.pro_id then
    raise exception 'Action non autorisée';
  end if;

  insert into public.sessions (mission_id, studio_id, pro_id, application_id, status)
  values (
    p_mission_id,
    v_mission.studio_id,
    v_application.pro_id,
    v_application.id,
    case
      when v_mission.status::text = 'completed' then 'completed'
      when v_mission.status::text = 'cancelled' then 'cancelled'
      else 'confirmed'
    end
  )
  on conflict (mission_id) do update
    set studio_id = excluded.studio_id,
        pro_id = excluded.pro_id,
        application_id = excluded.application_id,
        status = excluded.status,
        updated_at = now()
  returning id into v_session_id;

  return v_session_id;
end;
$$;

grant execute on function public.get_or_create_session_for_mission(uuid) to authenticated;

drop function if exists public.accept_application(uuid);

create or replace function public.accept_application(p_application_id uuid)
returns table (
  session_id uuid,
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
  v_session_id uuid;
begin
  select a.*
  into v_application
  from public.applications as a
  where a.id = p_application_id;

  if not found then
    raise exception 'Application introuvable';
  end if;

  if not exists (
    select 1
    from public.missions as m
    where m.id = v_application.mission_id
      and m.studio_id = auth.uid()
  ) then
    raise exception 'Action non autorisée';
  end if;

  update public.applications as a
  set status = 'accepted'
  where a.id = p_application_id;

  update public.applications as a
  set status = 'rejected'
  where a.mission_id = v_application.mission_id
    and a.id <> p_application_id
    and a.status::text = 'pending';

  update public.missions as m
  set selected_pro_id = v_application.pro_id,
      status = 'in_progress',
      applications_count = (
        select count(*)::integer
        from public.applications as a2
        where a2.mission_id = v_application.mission_id
          and a2.status::text = 'pending'
      )
  where m.id = v_application.mission_id;

  insert into public.sessions (mission_id, studio_id, pro_id, application_id, status)
  values (
    v_application.mission_id,
    auth.uid(),
    v_application.pro_id,
    p_application_id,
    'confirmed'
  )
  on conflict (mission_id) do update
    set studio_id = excluded.studio_id,
        pro_id = excluded.pro_id,
        application_id = excluded.application_id,
        status = 'confirmed',
        updated_at = now()
  returning id into v_session_id;

  return query
  select v_session_id, a.id, a.mission_id, a.pro_id, a.status
  from public.applications as a
  where a.id = p_application_id;
end;
$$;

grant execute on function public.accept_application(uuid) to authenticated;

insert into storage.buckets (id, name, public)
select 'message-files', 'message-files', true
where not exists (
  select 1
  from storage.buckets
  where id = 'message-files'
);

update storage.buckets
set public = true
where id = 'message-files';

drop policy if exists "message files public" on storage.objects;
create policy "message files public"
on storage.objects
for select
using (bucket_id = 'message-files');

drop policy if exists "message files upload authenticated" on storage.objects;
create policy "message files upload authenticated"
on storage.objects
for insert
with check (
  bucket_id = 'message-files'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "message files delete owner" on storage.objects;
create policy "message files delete owner"
on storage.objects
for delete
using (
  bucket_id = 'message-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sessions'
    ) then
      execute 'alter publication supabase_realtime add table public.sessions';
    end if;
  end if;
end $$;
