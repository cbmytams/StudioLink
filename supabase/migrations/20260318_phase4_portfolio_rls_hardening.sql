begin;

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_items_pro_id on public.portfolio_items(pro_id);

do $$
begin
  if to_regclass('public.reviews') is not null then
    execute '
      create unique index if not exists reviews_unique_once_per_mission
      on public.reviews(reviewer_id, mission_id)
    ';
  end if;
end
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        coalesce(to_jsonb(p)->>'user_type', '') = 'admin'
        or coalesce(to_jsonb(p)->>'type', '') = 'admin'
      )
  );
$$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';
    execute 'drop policy if exists profiles_select_public on public.profiles';
    execute 'drop policy if exists profiles_update_own on public.profiles';
    execute 'drop policy if exists profiles_insert_own on public.profiles';
    execute 'create policy profiles_select_public on public.profiles for select using (true)';
    execute 'create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id)';
    execute 'create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id)';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.missions') is not null then
    execute 'alter table public.missions enable row level security';
    execute 'drop policy if exists missions_select_public_open on public.missions';
    execute 'drop policy if exists missions_insert_owner on public.missions';
    execute 'drop policy if exists missions_update_owner on public.missions';

    execute $policy$
      create policy missions_select_public_open
      on public.missions
      for select
      using (status::text in ('open','published','selecting'))
    $policy$;

    execute $policy$
      create policy missions_insert_owner
      on public.missions
      for insert
      with check (auth.uid() = studio_id)
    $policy$;

    execute $policy$
      create policy missions_update_owner
      on public.missions
      for update
      using (auth.uid() = studio_id)
      with check (auth.uid() = studio_id)
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.applications') is not null then
    execute 'alter table public.applications enable row level security';
    execute 'drop policy if exists applications_select_pro_owner on public.applications';
    execute 'drop policy if exists applications_select_studio_owner on public.applications';
    execute 'drop policy if exists applications_insert_pro on public.applications';
    execute 'drop policy if exists applications_update_pro_or_studio on public.applications';

    execute $policy$
      create policy applications_select_pro_owner
      on public.applications
      for select
      using (auth.uid() = pro_id)
    $policy$;

    execute $policy$
      create policy applications_select_studio_owner
      on public.applications
      for select
      using (
        exists (
          select 1
          from public.missions m
          where m.id = mission_id and m.studio_id = auth.uid()
        )
      )
    $policy$;

    execute $policy$
      create policy applications_insert_pro
      on public.applications
      for insert
      with check (auth.uid() = pro_id)
    $policy$;

    execute $policy$
      create policy applications_update_pro_or_studio
      on public.applications
      for update
      using (
        auth.uid() = pro_id
        or exists (
          select 1
          from public.missions m
          where m.id = mission_id and m.studio_id = auth.uid()
        )
      )
      with check (
        auth.uid() = pro_id
        or exists (
          select 1
          from public.missions m
          where m.id = mission_id and m.studio_id = auth.uid()
        )
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.messages') is not null and to_regclass('public.conversations') is not null then
    execute 'alter table public.messages enable row level security';
    execute 'drop policy if exists messages_select_participants on public.messages';
    execute 'drop policy if exists messages_insert_participants on public.messages';
    execute 'drop policy if exists messages_update_sender on public.messages';

    execute $policy$
      create policy messages_select_participants
      on public.messages
      for select
      using (
        exists (
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
  end if;
end
$$;

do $$
begin
  if to_regclass('public.notifications') is not null then
    execute 'alter table public.notifications enable row level security';
    execute 'drop policy if exists notifications_owner_all on public.notifications';
    execute $policy$
      create policy notifications_owner_all
      on public.notifications
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews enable row level security';
    execute 'drop policy if exists reviews_select_public on public.reviews';
    execute 'drop policy if exists reviews_insert_owner on public.reviews';
    execute $policy$
      create policy reviews_select_public
      on public.reviews
      for select
      using (true)
    $policy$;
    execute $policy$
      create policy reviews_insert_owner
      on public.reviews
      for insert
      with check (auth.uid() = reviewer_id)
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.saved_items') is not null then
    execute 'alter table public.saved_items enable row level security';
    execute 'drop policy if exists saved_items_owner_all on public.saved_items';
    execute $policy$
      create policy saved_items_owner_all
      on public.saved_items
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)
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
    execute $policy$
      create policy invitation_codes_public_read
      on public.invitation_codes
      for select
      using (true)
    $policy$;
    execute $policy$
      create policy invitation_codes_admin_write
      on public.invitation_codes
      for all
      using (public.is_admin_user())
      with check (public.is_admin_user())
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.invitations') is not null then
    execute 'alter table public.invitations enable row level security';
    execute 'drop policy if exists invitations_public_read on public.invitations';
    execute 'drop policy if exists invitations_admin_write on public.invitations';
    execute $policy$
      create policy invitations_public_read
      on public.invitations
      for select
      using (true)
    $policy$;
    execute $policy$
      create policy invitations_admin_write
      on public.invitations
      for all
      using (public.is_admin_user())
      with check (public.is_admin_user())
    $policy$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.portfolio_items') is not null then
    execute 'alter table public.portfolio_items enable row level security';
    execute 'drop policy if exists portfolio_select_public on public.portfolio_items';
    execute 'drop policy if exists portfolio_insert_owner on public.portfolio_items';
    execute 'drop policy if exists portfolio_update_owner on public.portfolio_items';
    execute 'drop policy if exists portfolio_delete_owner on public.portfolio_items';

    execute $policy$
      create policy portfolio_select_public
      on public.portfolio_items
      for select
      using (true)
    $policy$;

    execute $policy$
      create policy portfolio_insert_owner
      on public.portfolio_items
      for insert
      with check (auth.uid() = pro_id)
    $policy$;

    execute $policy$
      create policy portfolio_update_owner
      on public.portfolio_items
      for update
      using (auth.uid() = pro_id)
      with check (auth.uid() = pro_id)
    $policy$;

    execute $policy$
      create policy portfolio_delete_owner
      on public.portfolio_items
      for delete
      using (auth.uid() = pro_id)
    $policy$;
  end if;
end
$$;

commit;
