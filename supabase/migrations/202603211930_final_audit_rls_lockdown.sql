begin;

alter table if exists public.messages
  add column if not exists read_at timestamptz;

create index if not exists messages_unread_idx
  on public.messages (conversation_id, sender_id, read_at)
  where read_at is null;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';
    execute 'drop policy if exists profiles_audit_select_public on public.profiles';
    execute 'drop policy if exists profiles_audit_insert_own on public.profiles';
    execute 'drop policy if exists profiles_audit_update_own on public.profiles';
    execute 'drop policy if exists profiles_audit_delete_own on public.profiles';
    execute 'create policy profiles_audit_select_public on public.profiles for select using (true)';
    execute 'create policy profiles_audit_insert_own on public.profiles for insert with check (auth.uid() = id)';
    execute 'create policy profiles_audit_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id)';
    execute 'create policy profiles_audit_delete_own on public.profiles for delete using (auth.uid() = id)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.missions') is not null then
    execute 'alter table public.missions enable row level security';
    execute 'drop policy if exists missions_select_all on public.missions';
    execute 'drop policy if exists missions_select_public_open on public.missions';
    execute 'drop policy if exists missions_select_published_or_owner on public.missions';
    execute 'drop policy if exists missions_select_open_or_owner on public.missions';
    execute 'drop policy if exists missions_audit_select_open_or_owner on public.missions';
    execute 'drop policy if exists missions_audit_insert_owner on public.missions';
    execute 'drop policy if exists missions_audit_update_owner on public.missions';
    execute 'drop policy if exists missions_audit_delete_owner on public.missions';
    execute $sql$
      create policy missions_audit_select_open_or_owner
      on public.missions
      for select
      using (
        status in ('open', 'published', 'selecting')
        or studio_id = auth.uid()
      )
    $sql$;
    execute 'create policy missions_audit_insert_owner on public.missions for insert with check (studio_id = auth.uid())';
    execute 'create policy missions_audit_update_owner on public.missions for update using (studio_id = auth.uid()) with check (studio_id = auth.uid())';
    execute 'create policy missions_audit_delete_owner on public.missions for delete using (studio_id = auth.uid())';
  end if;
end $$;

do $$
begin
  if to_regclass('public.applications') is not null then
    execute 'alter table public.applications enable row level security';
    execute 'drop policy if exists applications_audit_select_related on public.applications';
    execute 'drop policy if exists applications_audit_insert_pro on public.applications';
    execute 'drop policy if exists applications_audit_update_related on public.applications';
    execute 'drop policy if exists applications_audit_delete_related on public.applications';
    execute $sql$
      create policy applications_audit_select_related
      on public.applications
      for select
      using (
        pro_id = auth.uid()
        or exists (
          select 1
          from public.missions m
          where m.id = applications.mission_id
            and m.studio_id = auth.uid()
        )
      )
    $sql$;
    execute 'create policy applications_audit_insert_pro on public.applications for insert with check (pro_id = auth.uid())';
    execute $sql$
      create policy applications_audit_update_related
      on public.applications
      for update
      using (
        pro_id = auth.uid()
        or exists (
          select 1
          from public.missions m
          where m.id = applications.mission_id
            and m.studio_id = auth.uid()
        )
      )
      with check (
        pro_id = auth.uid()
        or exists (
          select 1
          from public.missions m
          where m.id = applications.mission_id
            and m.studio_id = auth.uid()
        )
      )
    $sql$;
    execute $sql$
      create policy applications_audit_delete_related
      on public.applications
      for delete
      using (
        pro_id = auth.uid()
        or exists (
          select 1
          from public.missions m
          where m.id = applications.mission_id
            and m.studio_id = auth.uid()
        )
      )
    $sql$;
  end if;
end $$;

do $$
declare
  has_studio boolean;
  has_pro boolean;
  has_participant_1 boolean;
  has_participant_2 boolean;
  member_expr text := 'false';
begin
  if to_regclass('public.conversations') is null then
    return;
  end if;

  execute 'alter table public.conversations enable row level security';

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'studio_id'
  ) into has_studio;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'pro_id'
  ) into has_pro;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'participant_1'
  ) into has_participant_1;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'participant_2'
  ) into has_participant_2;

  if has_studio then member_expr := member_expr || ' or auth.uid() = studio_id'; end if;
  if has_pro then member_expr := member_expr || ' or auth.uid() = pro_id'; end if;
  if has_participant_1 then member_expr := member_expr || ' or auth.uid() = participant_1'; end if;
  if has_participant_2 then member_expr := member_expr || ' or auth.uid() = participant_2'; end if;

  execute 'drop policy if exists conversations_audit_select_participants on public.conversations';
  execute 'drop policy if exists conversations_audit_insert_participants on public.conversations';
  execute 'drop policy if exists conversations_audit_update_participants on public.conversations';
  execute format(
    'create policy conversations_audit_select_participants on public.conversations for select using (%s)',
    member_expr
  );
  execute format(
    'create policy conversations_audit_insert_participants on public.conversations for insert with check (%s)',
    member_expr
  );
  execute format(
    'create policy conversations_audit_update_participants on public.conversations for update using (%s) with check (%s)',
    member_expr,
    member_expr
  );
end $$;

do $$
declare
  has_studio boolean;
  has_pro boolean;
  has_participant_1 boolean;
  has_participant_2 boolean;
  convo_member_expr text := 'false';
begin
  if to_regclass('public.messages') is null or to_regclass('public.conversations') is null then
    return;
  end if;

  execute 'alter table public.messages enable row level security';

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'studio_id'
  ) into has_studio;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'pro_id'
  ) into has_pro;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'participant_1'
  ) into has_participant_1;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'participant_2'
  ) into has_participant_2;

  if has_studio then convo_member_expr := convo_member_expr || ' or c.studio_id = auth.uid()'; end if;
  if has_pro then convo_member_expr := convo_member_expr || ' or c.pro_id = auth.uid()'; end if;
  if has_participant_1 then convo_member_expr := convo_member_expr || ' or c.participant_1 = auth.uid()'; end if;
  if has_participant_2 then convo_member_expr := convo_member_expr || ' or c.participant_2 = auth.uid()'; end if;

  execute 'drop policy if exists messages_audit_select_participants on public.messages';
  execute 'drop policy if exists messages_audit_insert_participants on public.messages';
  execute 'drop policy if exists messages_audit_update_participants on public.messages';
  execute format(
    'create policy messages_audit_select_participants
      on public.messages
      for select
      using (
        exists (
          select 1 from public.conversations c
          where c.id = messages.conversation_id
            and (%s)
        )
      )',
    convo_member_expr
  );
  execute format(
    'create policy messages_audit_insert_participants
      on public.messages
      for insert
      with check (
        auth.uid() = sender_id
        and exists (
          select 1 from public.conversations c
          where c.id = messages.conversation_id
            and (%s)
        )
      )',
    convo_member_expr
  );
  execute format(
    'create policy messages_audit_update_participants
      on public.messages
      for update
      using (
        exists (
          select 1 from public.conversations c
          where c.id = messages.conversation_id
            and (%s)
        )
      )
      with check (
        exists (
          select 1 from public.conversations c
          where c.id = messages.conversation_id
            and (%s)
        )
      )',
    convo_member_expr,
    convo_member_expr
  );
end $$;

do $$
begin
  if to_regclass('public.notifications') is not null then
    execute 'alter table public.notifications enable row level security';
    execute 'drop policy if exists notifications_audit_select_own on public.notifications';
    execute 'drop policy if exists notifications_audit_update_own on public.notifications';
    execute 'drop policy if exists notifications_audit_insert_own on public.notifications';
    execute 'create policy notifications_audit_select_own on public.notifications for select using (user_id = auth.uid())';
    execute 'create policy notifications_audit_update_own on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid())';
    execute 'create policy notifications_audit_insert_own on public.notifications for insert with check (user_id = auth.uid())';
  end if;
end $$;

do $$
begin
  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews enable row level security';
    execute 'drop policy if exists reviews_audit_select_public on public.reviews';
    execute 'drop policy if exists reviews_audit_insert_owner on public.reviews';
    execute 'create policy reviews_audit_select_public on public.reviews for select using (true)';
    execute 'create policy reviews_audit_insert_owner on public.reviews for insert with check (reviewer_id = auth.uid())';
  end if;
end $$;

do $$
begin
  if to_regclass('public.saved_items') is not null then
    execute 'alter table public.saved_items enable row level security';
    execute 'drop policy if exists saved_items_audit_select_own on public.saved_items';
    execute 'drop policy if exists saved_items_audit_insert_own on public.saved_items';
    execute 'drop policy if exists saved_items_audit_delete_own on public.saved_items';
    execute 'create policy saved_items_audit_select_own on public.saved_items for select using (user_id = auth.uid())';
    execute 'create policy saved_items_audit_insert_own on public.saved_items for insert with check (user_id = auth.uid())';
    execute 'create policy saved_items_audit_delete_own on public.saved_items for delete using (user_id = auth.uid())';
  end if;

  if to_regclass('public.saved') is not null then
    execute 'alter table public.saved enable row level security';
    execute 'drop policy if exists saved_audit_select_own on public.saved';
    execute 'drop policy if exists saved_audit_insert_own on public.saved';
    execute 'drop policy if exists saved_audit_delete_own on public.saved';
    execute 'create policy saved_audit_select_own on public.saved for select using (user_id = auth.uid())';
    execute 'create policy saved_audit_insert_own on public.saved for insert with check (user_id = auth.uid())';
    execute 'create policy saved_audit_delete_own on public.saved for delete using (user_id = auth.uid())';
  end if;
end $$;

do $$
begin
  if to_regclass('public.portfolio_items') is not null then
    execute 'alter table public.portfolio_items enable row level security';
    execute 'drop policy if exists portfolio_items_audit_select_public on public.portfolio_items';
    execute 'drop policy if exists portfolio_items_audit_insert_owner on public.portfolio_items';
    execute 'drop policy if exists portfolio_items_audit_update_owner on public.portfolio_items';
    execute 'drop policy if exists portfolio_items_audit_delete_owner on public.portfolio_items';
    execute 'create policy portfolio_items_audit_select_public on public.portfolio_items for select using (true)';
    execute 'create policy portfolio_items_audit_insert_owner on public.portfolio_items for insert with check (pro_id = auth.uid())';
    execute 'create policy portfolio_items_audit_update_owner on public.portfolio_items for update using (pro_id = auth.uid()) with check (pro_id = auth.uid())';
    execute 'create policy portfolio_items_audit_delete_owner on public.portfolio_items for delete using (pro_id = auth.uid())';
  end if;
end $$;

do $$
begin
  if to_regclass('public.invitations') is not null then
    execute 'alter table public.invitations enable row level security';
    execute 'drop policy if exists invitations_select_unused on public.invitations';
    execute 'drop policy if exists invitations_update_claim on public.invitations';
    execute 'drop policy if exists invitations_public_read on public.invitations';
    execute 'drop policy if exists invitations_audit_admin_select on public.invitations';
    execute 'drop policy if exists invitations_audit_admin_insert on public.invitations';
    execute 'drop policy if exists invitations_audit_admin_update on public.invitations';
    execute 'drop policy if exists invitations_audit_admin_delete on public.invitations';

    execute $sql$
      create policy invitations_audit_admin_select
      on public.invitations
      for select
      using (
        exists (
          select 1
          from public.admin_users au
          where au.user_id = auth.uid()
        )
      )
    $sql$;
    execute $sql$
      create policy invitations_audit_admin_insert
      on public.invitations
      for insert
      with check (
        exists (
          select 1
          from public.admin_users au
          where au.user_id = auth.uid()
        )
      )
    $sql$;
    execute $sql$
      create policy invitations_audit_admin_update
      on public.invitations
      for update
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
      )
    $sql$;
    execute $sql$
      create policy invitations_audit_admin_delete
      on public.invitations
      for delete
      using (
        exists (
          select 1
          from public.admin_users au
          where au.user_id = auth.uid()
        )
      )
    $sql$;
  end if;
end $$;

commit;
