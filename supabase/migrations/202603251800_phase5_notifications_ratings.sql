begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists link text,
  add column if not exists read boolean default false,
  add column if not exists created_at timestamptz default now();

update public.notifications
set data = coalesce(data, '{}'::jsonb) || case
  when link is not null and not (coalesce(data, '{}'::jsonb) ? 'link') then jsonb_build_object('link', link)
  else '{}'::jsonb
end;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.notifications drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.notifications
  add constraint notifications_type_check_phase5
  check (type in (
    'new_application',
    'application_accepted',
    'application_selected',
    'application_rejected',
    'new_message',
    'delivery_uploaded',
    'session_completed',
    'mission_completed',
    'new_rating'
  ));

alter table public.notifications enable row level security;

drop policy if exists own_notifications on public.notifications;
drop policy if exists notifications_audit_insert_own on public.notifications;
drop policy if exists notifications_audit_select_own on public.notifications;
drop policy if exists notifications_audit_update_own on public.notifications;
drop policy if exists "User: select own notifications" on public.notifications;
drop policy if exists "User: update own notifications" on public.notifications;
drop policy if exists "Service role: insert" on public.notifications;

create policy "User: select own notifications"
on public.notifications for select
using (user_id = auth.uid());

create policy "User: update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Service role: insert"
on public.notifications for insert
with check (auth.role() = 'service_role');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

alter table public.sessions
  add column if not exists completed_at timestamptz;

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rated_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(session_id, rater_id)
);

alter table public.ratings
  add column if not exists rater_id uuid references public.profiles(id) on delete cascade,
  add column if not exists rated_id uuid references public.profiles(id) on delete cascade,
  add column if not exists score smallint,
  add column if not exists comment text,
  add column if not exists created_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ratings' and column_name = 'from_profile_id'
  ) then
    execute $sql$
      update public.ratings
      set rater_id = coalesce(rater_id, from_profile_id)
      where rater_id is null
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ratings' and column_name = 'to_profile_id'
  ) then
    execute $sql$
      update public.ratings
      set rated_id = coalesce(rated_id, to_profile_id)
      where rated_id is null
    $sql$;
  end if;
end $$;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.ratings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%score%'
  loop
    execute format('alter table public.ratings drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.ratings
  alter column rater_id set not null,
  alter column rated_id set not null,
  alter column score set not null;

alter table public.ratings
  add constraint ratings_score_check_phase5 check (score between 1 and 5);

create unique index if not exists ratings_session_rater_unique_idx
  on public.ratings(session_id, rater_id);

alter table public.ratings enable row level security;

drop policy if exists "Participants: select ratings" on public.ratings;
drop policy if exists "Rater: insert own rating" on public.ratings;

create policy "Participants: select ratings"
on public.ratings for select
using (rater_id = auth.uid() or rated_id = auth.uid());

create policy "Rater: insert own rating"
on public.ratings for insert
with check (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.sessions s
    where s.id = session_id
      and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
      and s.status = 'completed'
  )
);

alter table public.profiles
  add column if not exists rating_avg numeric(3,2) default null,
  add column if not exists rating_count integer default 0;

create or replace function public.update_profile_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  v_rated_id uuid := coalesce(new.rated_id, old.rated_id);
begin
  update public.profiles
  set
    rating_avg = (
      select round(avg(score)::numeric, 2)
      from public.ratings
      where rated_id = v_rated_id
    ),
    rating_count = (
      select count(*)
      from public.ratings
      where rated_id = v_rated_id
    )
  where id = v_rated_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_update_profile_rating on public.ratings;
create trigger trg_update_profile_rating
after insert or update on public.ratings
for each row execute function public.update_profile_rating();

create or replace function public.notify_new_application()
returns trigger
language plpgsql
security definer
as $$
declare
  v_studio_id uuid;
  v_mission_title text;
begin
  select m.studio_id, coalesce(nullif(m.title, ''), nullif(m.service_type, ''), 'Mission')
  into v_studio_id, v_mission_title
  from public.missions m
  where m.id = new.mission_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_studio_id,
    'new_application',
    'Nouvelle candidature',
    'Un Pro a postulé à votre mission "' || v_mission_title || '"',
    jsonb_build_object('missionId', new.mission_id, 'applicationId', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_application on public.applications;
create trigger trg_notify_new_application
after insert on public.applications
for each row execute function public.notify_new_application();

create or replace function public.notify_application_status()
returns trigger
language plpgsql
security definer
as $$
declare
  v_mission_title text;
  v_session_id uuid;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select coalesce(nullif(m.title, ''), nullif(m.service_type, ''), 'Mission')
  into v_mission_title
  from public.missions m
  where m.id = new.mission_id;

  if new.status = 'accepted' then
    select s.id
    into v_session_id
    from public.sessions s
    where s.mission_id = new.mission_id
      and s.pro_id = new.pro_id
    order by s.created_at desc
    limit 1;

    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.pro_id,
      'application_accepted',
      'Candidature acceptée 🎉',
      'Votre candidature pour "' || v_mission_title || '" a été acceptée',
      jsonb_build_object(
        'missionId', new.mission_id,
        'applicationId', new.id,
        'sessionId', v_session_id
      )
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.pro_id,
      'application_rejected',
      'Candidature non retenue',
      'Votre candidature pour "' || v_mission_title || '" n''a pas été retenue',
      jsonb_build_object('missionId', new.mission_id, 'applicationId', new.id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_application_status on public.applications;
create trigger trg_notify_application_status
after update of status on public.applications
for each row execute function public.notify_application_status();

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
as $$
declare
  v_other_user_id uuid;
  v_sender_name text;
begin
  if new.session_id is null then
    return new;
  end if;

  select case
    when s.studio_id = new.sender_id then s.pro_id
    else s.studio_id
  end
  into v_other_user_id
  from public.sessions s
  where s.id = new.session_id;

  if v_other_user_id is null then
    return new;
  end if;

  select coalesce(
    nullif(p.full_name, ''),
    nullif(p.company_name, ''),
    nullif(p.display_name, ''),
    split_part(p.email, '@', 1),
    'quelqu''un'
  )
  into v_sender_name
  from public.profiles p
  where p.id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_other_user_id,
    'new_message',
    'Nouveau message de ' || coalesce(v_sender_name, 'quelqu''un'),
    case
      when new.file_name is not null then '📎 ' || new.file_name
      else left(coalesce(new.content, ''), 80)
    end,
    jsonb_build_object('sessionId', new.session_id, 'messageId', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
after insert on public.messages
for each row execute function public.notify_new_message();

create or replace function public.notify_delivery_uploaded()
returns trigger
language plpgsql
security definer
as $$
declare
  v_studio_id uuid;
begin
  if new.file_type <> 'delivery' or new.session_id is null then
    return new;
  end if;

  select s.studio_id
  into v_studio_id
  from public.sessions s
  where s.id = new.session_id;

  if v_studio_id is null then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_studio_id,
    'delivery_uploaded',
    'Livraison déposée 📦',
    'Le Pro a déposé le fichier : ' || new.file_name,
    jsonb_build_object('sessionId', new.session_id, 'fileId', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_delivery_uploaded on public.mission_files;
create trigger trg_notify_delivery_uploaded
after insert on public.mission_files
for each row execute function public.notify_delivery_uploaded();

create or replace function public.notify_new_rating()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.rated_id,
    'new_rating',
    'Nouvel avis reçu',
    'Vous avez reçu une note de ' || new.score || '/5.',
    jsonb_build_object('sessionId', new.session_id, 'ratingId', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_rating on public.ratings;
create trigger trg_notify_new_rating
after insert on public.ratings
for each row execute function public.notify_new_rating();

create or replace function public.complete_session(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_studio_id uuid;
  v_pro_id uuid;
  v_mission_id uuid;
begin
  update public.sessions
  set status = 'completed',
      completed_at = now(),
      updated_at = now()
  where id = p_session_id
    and status <> 'completed'
    and (studio_id = auth.uid() or pro_id = auth.uid())
  returning studio_id, pro_id, mission_id
  into v_studio_id, v_pro_id, v_mission_id;

  if v_mission_id is null then
    return;
  end if;

  update public.missions
  set status = 'completed'
  where id = v_mission_id
    and status <> 'completed';

  insert into public.notifications (user_id, type, title, body, data)
  values
    (
      v_studio_id,
      'session_completed',
      'Session terminée',
      'Laissez une note au Pro',
      jsonb_build_object('sessionId', p_session_id)
    ),
    (
      v_pro_id,
      'session_completed',
      'Session terminée',
      'Laissez une note au Studio',
      jsonb_build_object('sessionId', p_session_id)
    );
end;
$$;

commit;
