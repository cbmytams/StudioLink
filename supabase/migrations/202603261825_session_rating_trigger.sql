alter table public.sessions
  add column if not exists rating_reminder_sent_at timestamptz;

create or replace function public.get_sessions_needing_rating_reminder()
returns table(
  session_id uuid,
  studio_email text,
  pro_email text,
  mission_title text,
  pro_name text,
  studio_name text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as session_id,
    sp.email as studio_email,
    pp.email as pro_email,
    coalesce(m.title, 'Mission StudioLink') as mission_title,
    coalesce(pp.display_name, pp.full_name, 'Professionnel') as pro_name,
    coalesce(sp.display_name, sp.full_name, 'Studio') as studio_name
  from public.sessions s
  join public.profiles sp on sp.id = s.studio_id
  join public.profiles pp on pp.id = s.pro_id
  join public.missions m on m.id = s.mission_id
  where s.status = 'completed'
    and s.completed_at < now() - interval '23 hours'
    and s.completed_at > now() - interval '25 hours'
    and s.rating_reminder_sent_at is null;
$$;

grant execute on function public.get_sessions_needing_rating_reminder() to service_role;
