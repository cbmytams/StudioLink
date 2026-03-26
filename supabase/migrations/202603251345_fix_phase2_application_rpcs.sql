create or replace function public.accept_application(p_application_id uuid)
returns table (
  application_id uuid,
  mission_id uuid,
  pro_id uuid,
  status public.application_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications%rowtype;
begin
  select a.*
  into v_application
  from public.applications as a
  where a.id = p_application_id;

  if not found then
    raise exception 'Application introuvable';
  end if;

  if not exists (
    select 1
    from public.missions as m
    where m.id = v_application.mission_id
      and m.studio_id = auth.uid()
  ) then
    raise exception 'Action non autorisée';
  end if;

  update public.applications as a
  set status = 'accepted'
  where a.id = p_application_id;

  update public.applications as a
  set status = 'rejected'
  where a.mission_id = v_application.mission_id
    and a.id <> p_application_id
    and a.status::text = 'pending';

  update public.missions as m
  set selected_pro_id = v_application.pro_id,
      status = 'in_progress',
      applications_count = (
        select count(*)::integer
        from public.applications as a2
        where a2.mission_id = v_application.mission_id
          and a2.status::text = 'pending'
      )
  where m.id = v_application.mission_id;

  return query
  select a.id, a.mission_id, a.pro_id, a.status
  from public.applications as a
  where a.id = p_application_id;
end;
$$;

create or replace function public.reject_application(p_application_id uuid)
returns table (
  application_id uuid,
  mission_id uuid,
  pro_id uuid,
  status public.application_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications%rowtype;
begin
  select a.*
  into v_application
  from public.applications as a
  where a.id = p_application_id;

  if not found then
    raise exception 'Application introuvable';
  end if;

  if not exists (
    select 1
    from public.missions as m
    where m.id = v_application.mission_id
      and m.studio_id = auth.uid()
  ) then
    raise exception 'Action non autorisée';
  end if;

  update public.applications as a
  set status = 'rejected'
  where a.id = p_application_id;

  update public.missions as m
  set applications_count = (
    select count(*)::integer
    from public.applications as a2
    where a2.mission_id = v_application.mission_id
      and a2.status::text = 'pending'
  )
  where m.id = v_application.mission_id;

  return query
  select a.id, a.mission_id, a.pro_id, a.status
  from public.applications as a
  where a.id = p_application_id;
end;
$$;

grant execute on function public.accept_application(uuid) to authenticated;
grant execute on function public.reject_application(uuid) to authenticated;
