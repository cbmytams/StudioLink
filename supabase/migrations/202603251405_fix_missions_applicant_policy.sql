create or replace function public.has_mission_application_access(p_mission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications as a
    where a.mission_id = p_mission_id
      and a.pro_id = auth.uid()
  );
$$;

revoke all on function public.has_mission_application_access(uuid) from public;
grant execute on function public.has_mission_application_access(uuid) to authenticated;

drop policy if exists missions_select_applicant on public.missions;

create policy missions_select_applicant
  on public.missions
  for select
  using (public.has_mission_application_access(id));
