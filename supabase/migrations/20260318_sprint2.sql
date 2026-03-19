begin;

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in (
    'new_application','application_selected','application_rejected',
    'new_message','mission_completed'
  )),
  title text not null,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
drop policy if exists "own_notifications" on notifications;
create policy "own_notifications" on notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references auth.users(id) on delete cascade not null,
  reviewee_id uuid references auth.users(id) on delete cascade not null,
  mission_id uuid references missions(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(reviewer_id, mission_id)
);
alter table reviews enable row level security;
drop policy if exists "read_reviews" on reviews;
create policy "read_reviews" on reviews for select using (true);
drop policy if exists "create_review" on reviews;
create policy "create_review" on reviews for insert
  with check (auth.uid() = reviewer_id);

create table if not exists saved_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid not null,
  item_type text not null check (item_type in ('mission','pro','studio')),
  created_at timestamptz default now(),
  unique(user_id, item_id, item_type)
);
alter table saved_items enable row level security;
drop policy if exists "own_saved" on saved_items;
create policy "own_saved" on saved_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  participant_1 uuid references auth.users(id) on delete cascade not null,
  participant_2 uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);
create unique index if not exists conversations_pair_unique_idx
  on conversations (
    least(participant_1::text, participant_2::text),
    greatest(participant_1::text, participant_2::text)
  );
alter table conversations enable row level security;
drop policy if exists "participant_conv" on conversations;
create policy "participant_conv" on conversations for all
  using (auth.uid() = participant_1 or auth.uid() = participant_2)
  with check (auth.uid() = participant_1 or auth.uid() = participant_2);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text,
  file_url text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table messages enable row level security;
drop policy if exists "participant_messages" on messages;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'conversation_id'
  ) and to_regclass('public.conversations') is not null then
    execute $policy$
      create policy "participant_messages" on messages for all using (
        exists (
          select 1 from conversations c where c.id = conversation_id
          and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
        )
      ) with check (
        auth.uid() = sender_id and
        exists (
          select 1 from conversations c where c.id = conversation_id
          and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
        )
      )
    $policy$;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'session_id'
  ) and to_regclass('public.sessions') is not null then
    execute $policy$
      create policy "participant_messages" on messages for all using (
        exists (
          select 1
          from sessions ss
          join studios st on st.id = ss.studio_id
          join professionals pr on pr.id = ss.pro_id
          where ss.id = session_id
            and (st.profile_id = auth.uid() or pr.profile_id = auth.uid())
        )
      ) with check (
        auth.uid() = sender_id and
        exists (
          select 1
          from sessions ss
          join studios st on st.id = ss.studio_id
          join professionals pr on pr.id = ss.pro_id
          where ss.id = session_id
            and (st.profile_id = auth.uid() or pr.profile_id = auth.uid())
        )
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication p
    join pg_publication_rel pr on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end
$$;

alter table pro_profiles
  add column if not exists availability_slots jsonb default '[]';

alter table profiles
  add column if not exists notification_preferences jsonb default '{"new_application":true,"messages":true,"status_updates":true}';

create or replace function fn_notify_new_application()
returns trigger language plpgsql security definer as $$
declare
  v_mission record;
  v_pro_name text;
begin
  select
    id,
    studio_id,
    coalesce(nullif(service_type, ''), 'Mission') as title
  into v_mission
  from missions
  where id = new.mission_id;

  select coalesce(display_name, email) into v_pro_name
    from profiles where id = new.pro_id;

  insert into notifications(user_id, type, title, body, link)
  values (
    v_mission.studio_id,
    'new_application',
    'Nouvelle candidature',
    coalesce(v_pro_name, 'Un pro') || ' a postulé à "' || v_mission.title || '"',
    '/studio/missions/' || v_mission.id || '/applications'
  );
  return new;
end;
$$;
drop trigger if exists trg_notify_new_application on applications;
create trigger trg_notify_new_application
  after insert on applications
  for each row execute function fn_notify_new_application();

create or replace function fn_notify_application_status()
returns trigger language plpgsql security definer as $$
declare
  v_mission record;
begin
  if old.status = new.status then return new; end if;
  select
    id,
    coalesce(nullif(service_type, ''), 'Mission') as title
  into v_mission
  from missions
  where id = new.mission_id;

  if new.status = 'selected' then
    insert into notifications(user_id, type, title, body, link)
    values (
      new.pro_id, 'application_selected',
      '🎉 Candidature retenue !',
      'Votre candidature pour "' || v_mission.title || '" a été retenue.',
      '/missions/' || v_mission.id
    );
  elsif new.status = 'rejected' then
    insert into notifications(user_id, type, title, body, link)
    values (
      new.pro_id, 'application_rejected',
      'Candidature non retenue',
      'Votre candidature pour "' || v_mission.title || '" n''a pas été retenue.',
      '/missions/' || v_mission.id
    );
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_application_status on applications;
create trigger trg_notify_application_status
  after update of status on applications
  for each row execute function fn_notify_application_status();

create or replace function fn_notify_mission_completed()
returns trigger language plpgsql security definer as $$
declare
  v_pro_id uuid;
  v_title text;
begin
  if old.status = new.status or new.status != 'completed' then return new; end if;
  v_title := coalesce(nullif(new.service_type, ''), 'Mission');
  select pro_id into v_pro_id from applications
    where mission_id = new.id and status = 'selected' limit 1;
  insert into notifications(user_id, type, title, body, link)
  values (
    new.studio_id, 'mission_completed',
    'Mission terminée',
    '"' || v_title || '" est marquée comme terminée. Laissez un avis !',
    '/missions/' || new.id
  );
  if v_pro_id is not null then
    insert into notifications(user_id, type, title, body, link)
    values (
      v_pro_id, 'mission_completed',
      'Mission terminée',
      '"' || v_title || '" est terminée. Laissez un avis au studio !',
      '/missions/' || new.id
    );
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_mission_completed on missions;
create trigger trg_notify_mission_completed
  after update of status on missions
  for each row execute function fn_notify_mission_completed();

commit;
