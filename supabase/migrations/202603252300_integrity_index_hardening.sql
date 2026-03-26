begin;

create index if not exists idx_notifications_user_id
  on public.notifications (user_id);

create index if not exists idx_notifications_user_read
  on public.notifications (user_id, read);

create index if not exists idx_conversations_participant_1
  on public.conversations (participant_1);

create index if not exists idx_conversations_participant_2
  on public.conversations (participant_2);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'studio_id'
  ) then
    execute 'create index if not exists idx_conversations_studio_id on public.conversations (studio_id)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'pro_id'
  ) then
    execute 'create index if not exists idx_conversations_pro_id on public.conversations (pro_id)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'last_message_at'
  ) then
    execute 'create index if not exists idx_conversations_last_message_at on public.conversations (last_message_at desc)';
  else
    execute 'create index if not exists idx_conversations_created_at on public.conversations (created_at desc)';
  end if;
end $$;

create index if not exists idx_messages_session_unread
  on public.messages (session_id, sender_id, is_read)
  where session_id is not null and is_read = false;

alter table public.messages
  drop constraint if exists messages_chat_context_check;

alter table public.messages
  add constraint messages_chat_context_check
  check (
    ((session_id is not null)::int + (conversation_id is not null)::int) = 1
  );

drop trigger if exists applications_set_updated_at on public.applications;
drop index if exists public.ratings_session_rater_unique_idx;

commit;
