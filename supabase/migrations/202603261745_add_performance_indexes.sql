begin;

create index if not exists idx_missions_created_at
  on public.missions (created_at desc);

create index if not exists idx_missions_status_created_at
  on public.missions (status, created_at desc);

create index if not exists idx_applications_status
  on public.applications (status);

create index if not exists idx_messages_created_at
  on public.messages (created_at desc);

create index if not exists idx_messages_session_created_at
  on public.messages (session_id, created_at desc);

create index if not exists idx_sessions_status
  on public.sessions (status);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read)
  where read = false;

create index if not exists idx_profiles_user_type
  on public.profiles (user_type);

commit;
