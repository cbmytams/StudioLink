begin;

drop policy if exists missions_select_applicant on public.missions;

create or replace function public.has_application_for_mission(
  p_mission_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.applications a
    where a.mission_id = p_mission_id
      and a.pro_id = p_user_id
  );
$$;

create policy missions_select_applicant
on public.missions for select
using (public.has_application_for_mission(id, auth.uid()));

grant execute on function public.has_application_for_mission(uuid, uuid) to anon, authenticated;

commit;
