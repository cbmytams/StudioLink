begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
on public.admin_users
for select
using (auth.uid() = user_id);

drop policy if exists admin_users_manage_admin on public.admin_users;
create policy admin_users_manage_admin
on public.admin_users
for all
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  )
);

create or replace function public.is_admin_user_secure()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin_user_secure() to anon, authenticated;

create or replace function public.get_invitation_by_code(p_code text)
returns table (
  id uuid,
  code text,
  invitation_type text,
  email text,
  used boolean,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  has_email boolean;
  has_used boolean;
begin
  if v_code = '' then
    return;
  end if;

  if to_regclass('public.invitations') is not null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'email'
    ) into has_email;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used'
    ) into has_used;

    if has_email and has_used then
      return query execute format(
        $q$
          select
            i.id,
            i.code,
            i.type::text as invitation_type,
            i.email,
            coalesce(i.used, false) as used,
            i.expires_at,
            i.created_at
          from public.invitations i
          where upper(i.code) = %L
          limit 1
        $q$,
        v_code
      );
      return;
    end if;

    if has_email and not has_used then
      return query execute format(
        $q$
          select
            i.id,
            i.code,
            i.type::text as invitation_type,
            i.email,
            (i.used_by is not null) as used,
            i.expires_at,
            i.created_at
          from public.invitations i
          where upper(i.code) = %L
          limit 1
        $q$,
        v_code
      );
      return;
    end if;

    if not has_email and has_used then
      return query execute format(
        $q$
          select
            i.id,
            i.code,
            i.type::text as invitation_type,
            null::text as email,
            coalesce(i.used, false) as used,
            i.expires_at,
            i.created_at
          from public.invitations i
          where upper(i.code) = %L
          limit 1
        $q$,
        v_code
      );
      return;
    end if;

    return query execute format(
      $q$
        select
          i.id,
          i.code,
          i.type::text as invitation_type,
          null::text as email,
          (i.used_by is not null) as used,
          i.expires_at,
          i.created_at
        from public.invitations i
        where upper(i.code) = %L
        limit 1
      $q$,
      v_code
    );
    return;
  end if;

  if to_regclass('public.invitation_codes') is not null then
    return query execute format(
      $q$
        select
          ic.id,
          ic.code,
          ic.type::text as invitation_type,
          null::text as email,
          (ic.status::text = 'used') as used,
          ic.expires_at,
          ic.created_at
        from public.invitation_codes ic
        where upper(ic.code) = %L
        limit 1
      $q$,
      v_code
    );
  end if;
end;
$$;

grant execute on function public.get_invitation_by_code(text) to anon, authenticated;

create or replace function public.claim_invitation(p_code text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  row_count integer := 0;
  has_used boolean;
  has_used_at boolean;
  has_used_by boolean;
begin
  if v_code = '' or p_user_id is null then
    return false;
  end if;

  if to_regclass('public.invitations') is not null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used'
    ) into has_used;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used_at'
    ) into has_used_at;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used_by'
    ) into has_used_by;

    if has_used then
      if has_used_at and has_used_by then
        execute format(
          $q$
            update public.invitations
            set
              used = true,
              used_by = coalesce(used_by, %L::uuid),
              used_at = now()
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
              and (used_by is null or used_by = %L::uuid)
          $q$,
          p_user_id,
          v_code,
          p_user_id
        );
      elsif has_used_at and not has_used_by then
        execute format(
          $q$
            update public.invitations
            set
              used = true,
              used_at = now()
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
          $q$,
          v_code
        );
      elsif has_used_by then
        execute format(
          $q$
            update public.invitations
            set
              used = true,
              used_by = coalesce(used_by, %L::uuid)
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
              and (used_by is null or used_by = %L::uuid)
          $q$,
          p_user_id,
          v_code,
          p_user_id
        );
      else
        execute format(
          $q$
            update public.invitations
            set
              used = true
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
          $q$,
          v_code
        );
      end if;
    else
      if has_used_by then
        execute format(
          $q$
            update public.invitations
            set used_by = %L::uuid
            where upper(code) = %L
              and used_by is null
              and (expires_at is null or expires_at > now())
          $q$,
          p_user_id,
          v_code
        );
      end if;
    end if;

    get diagnostics row_count = ROW_COUNT;
    if row_count > 0 then
      return true;
    end if;
  end if;

  if to_regclass('public.invitation_codes') is not null then
    update public.invitation_codes
    set
      status = 'used',
      used_by = p_user_id,
      used_at = now()
    where upper(code) = v_code
      and status = 'available'
      and (expires_at is null or expires_at > now());

    get diagnostics row_count = ROW_COUNT;
    if row_count > 0 then
      return true;
    end if;
  end if;

  return false;
end;
$$;

grant execute on function public.claim_invitation(text, uuid) to anon, authenticated;

do $$
begin
  if to_regclass('public.invitations') is not null then
    execute 'alter table public.invitations enable row level security';
    execute 'drop policy if exists invitations_public_read on public.invitations';
    execute 'drop policy if exists invitations_select_unused on public.invitations';
    execute 'drop policy if exists invitations_update_claim on public.invitations';
    execute 'drop policy if exists invitations_admin_write on public.invitations';
    execute 'drop policy if exists invitations_admin_select on public.invitations';
    execute 'drop policy if exists invitations_admin_insert on public.invitations';
    execute 'drop policy if exists invitations_admin_update on public.invitations';
    execute 'drop policy if exists invitations_admin_delete on public.invitations';

    execute $policy$
      create policy invitations_admin_select
      on public.invitations
      for select
      using (public.is_admin_user_secure())
    $policy$;

    execute $policy$
      create policy invitations_admin_insert
      on public.invitations
      for insert
      with check (public.is_admin_user_secure())
    $policy$;

    execute $policy$
      create policy invitations_admin_update
      on public.invitations
      for update
      using (public.is_admin_user_secure())
      with check (public.is_admin_user_secure())
    $policy$;

    execute $policy$
      create policy invitations_admin_delete
      on public.invitations
      for delete
      using (public.is_admin_user_secure())
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.invitation_codes') is not null then
    execute 'alter table public.invitation_codes enable row level security';
    execute 'drop policy if exists invitation_codes_public_read on public.invitation_codes';
    execute 'drop policy if exists invitation_codes_admin_write on public.invitation_codes';
    execute 'drop policy if exists invitation_codes_admin_select on public.invitation_codes';
    execute 'drop policy if exists invitation_codes_admin_insert on public.invitation_codes';
    execute 'drop policy if exists invitation_codes_admin_update on public.invitation_codes';
    execute 'drop policy if exists invitation_codes_admin_delete on public.invitation_codes';

    execute $policy$
      create policy invitation_codes_admin_select
      on public.invitation_codes
      for select
      using (public.is_admin_user_secure())
    $policy$;

    execute $policy$
      create policy invitation_codes_admin_insert
      on public.invitation_codes
      for insert
      with check (public.is_admin_user_secure())
    $policy$;

    execute $policy$
      create policy invitation_codes_admin_update
      on public.invitation_codes
      for update
      using (public.is_admin_user_secure())
      with check (public.is_admin_user_secure())
    $policy$;

    execute $policy$
      create policy invitation_codes_admin_delete
      on public.invitation_codes
      for delete
      using (public.is_admin_user_secure())
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.missions') is not null then
    execute 'alter table public.missions enable row level security';
    execute 'drop policy if exists missions_select_all on public.missions';
    execute 'drop policy if exists missions_select_public_open on public.missions';
    execute 'drop policy if exists missions_select_published_or_owner on public.missions';
    execute 'drop policy if exists missions_select_open_or_owner on public.missions';

    if to_regclass('public.studios') is not null then
      execute $policy$
        create policy missions_select_open_or_owner
        on public.missions
        for select
        using (
          status::text in ('open', 'published', 'selecting')
          or auth.uid() = studio_id
          or exists (
            select 1
            from public.studios s
            where s.id = missions.studio_id
              and s.profile_id = auth.uid()
          )
        )
      $policy$;
    else
      execute $policy$
        create policy missions_select_open_or_owner
        on public.missions
        for select
        using (
          status::text in ('open', 'published', 'selecting')
          or auth.uid() = studio_id
        )
      $policy$;
    end if;
  end if;
end
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references auth.users(id) on delete cascade,
  participant_2 uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists conversations_pair_unique_idx
on public.conversations (
  least(participant_1::text, participant_2::text),
  greatest(participant_1::text, participant_2::text)
);

do $$
declare
  has_conversation_id boolean;
  has_session_id boolean;
begin
  if to_regclass('public.messages') is null then
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'conversation_id'
  ) into has_conversation_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'session_id'
  ) into has_session_id;

  if not has_conversation_id then
    execute 'alter table public.messages add column conversation_id uuid references public.conversations(id) on delete cascade';
  end if;

  if has_session_id
     and to_regclass('public.sessions') is not null
     and to_regclass('public.studios') is not null
     and to_regclass('public.professionals') is not null then
    insert into public.conversations (participant_1, participant_2)
    select distinct
      s.profile_id,
      p.profile_id
    from public.messages m
    join public.sessions ss on ss.id = m.session_id
    join public.studios s on s.id = ss.studio_id
    join public.professionals p on p.id = ss.pro_id
    where m.conversation_id is null
    on conflict do nothing;

    update public.messages m
    set conversation_id = c.id
    from public.sessions ss
    join public.studios s on s.id = ss.studio_id
    join public.professionals p on p.id = ss.pro_id
    join public.conversations c
      on least(c.participant_1::text, c.participant_2::text) = least(s.profile_id::text, p.profile_id::text)
     and greatest(c.participant_1::text, c.participant_2::text) = greatest(s.profile_id::text, p.profile_id::text)
    where m.session_id = ss.id
      and m.conversation_id is null;
  end if;

  execute 'create index if not exists idx_messages_conversation_id on public.messages(conversation_id)';
  execute 'alter table public.messages enable row level security';
  execute 'drop policy if exists messages_select_participants on public.messages';
  execute 'drop policy if exists messages_insert_participants on public.messages';
  execute 'drop policy if exists messages_update_sender on public.messages';
  execute 'drop policy if exists messages_select_parties on public.messages';
  execute 'drop policy if exists messages_insert_parties on public.messages';
  execute 'drop policy if exists participant_messages on public.messages';

  execute $policy$
    create policy messages_select_participants
    on public.messages
    for select
    using (
      conversation_id is not null
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_id
          and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
      )
    )
  $policy$;

  execute $policy$
    create policy messages_insert_participants
    on public.messages
    for insert
    with check (
      auth.uid() = sender_id
      and conversation_id is not null
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_id
          and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
      )
    )
  $policy$;

  execute $policy$
    create policy messages_update_sender
    on public.messages
    for update
    using (auth.uid() = sender_id)
    with check (auth.uid() = sender_id)
  $policy$;
end
$$;

commit;
