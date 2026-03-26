create or replace function public.extract_mission_amount(
  p_daily_rate integer,
  p_price text
)
returns numeric
language sql
immutable
set search_path = public
as $$
  select coalesce(
    p_daily_rate::numeric,
    nullif(regexp_replace(coalesce(p_price, ''), '[^0-9]+', '', 'g'), '')::numeric,
    0
  );
$$;

create or replace function public.get_studio_dashboard(p_studio_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is distinct from p_studio_id then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    'total_missions', (
      select count(*)
      from public.missions
      where studio_id = p_studio_id
    ),
    'published_missions', (
      select count(*)
      from public.missions
      where studio_id = p_studio_id
        and status::text in ('open', 'published', 'selecting')
    ),
    'closed_missions', (
      select count(*)
      from public.missions
      where studio_id = p_studio_id
        and status::text in ('completed', 'cancelled', 'expired', 'closed', 'rated')
    ),
    'total_applications', (
      select count(*)
      from public.applications a
      join public.missions m on m.id = a.mission_id
      where m.studio_id = p_studio_id
    ),
    'pending_applications', (
      select count(*)
      from public.applications a
      join public.missions m on m.id = a.mission_id
      where m.studio_id = p_studio_id
        and a.status = 'pending'
    ),
    'active_sessions', (
      select count(*)
      from public.sessions
      where studio_id = p_studio_id
        and status = 'confirmed'
    ),
    'completed_sessions', (
      select count(*)
      from public.sessions
      where studio_id = p_studio_id
        and status = 'completed'
    ),
    'total_spent', (
      select coalesce(sum(public.extract_mission_amount(m.daily_rate, m.price)), 0)
      from public.missions m
      join public.sessions s on s.mission_id = m.id
      where m.studio_id = p_studio_id
        and s.status = 'completed'
    ),
    'rating_avg', (
      select rating_avg
      from public.profiles
      where id = p_studio_id
    ),
    'rating_count', (
      select coalesce(rating_count, 0)
      from public.profiles
      where id = p_studio_id
    ),
    'recent_missions', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select
          m.id,
          coalesce(m.title, 'Mission') as title,
          m.status,
          m.created_at,
          (
            select count(*)
            from public.applications a
            where a.mission_id = m.id
          ) as application_count,
          (
            select s.id
            from public.sessions s
            where s.mission_id = m.id
            order by s.created_at desc
            limit 1
          ) as session_id
        from public.missions m
        where m.studio_id = p_studio_id
        order by m.created_at desc
        limit 5
      ) t
    ), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.get_pro_dashboard(p_pro_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is distinct from p_pro_id then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    'total_applications', (
      select count(*)
      from public.applications
      where pro_id = p_pro_id
    ),
    'pending_applications', (
      select count(*)
      from public.applications
      where pro_id = p_pro_id
        and status = 'pending'
    ),
    'accepted_applications', (
      select count(*)
      from public.applications
      where pro_id = p_pro_id
        and status = 'accepted'
    ),
    'rejected_applications', (
      select count(*)
      from public.applications
      where pro_id = p_pro_id
        and status = 'rejected'
    ),
    'active_sessions', (
      select count(*)
      from public.sessions
      where pro_id = p_pro_id
        and status = 'confirmed'
    ),
    'completed_sessions', (
      select count(*)
      from public.sessions
      where pro_id = p_pro_id
        and status = 'completed'
    ),
    'total_earned', (
      select coalesce(sum(public.extract_mission_amount(m.daily_rate, m.price)), 0)
      from public.missions m
      join public.sessions s on s.mission_id = m.id
      where s.pro_id = p_pro_id
        and s.status = 'completed'
    ),
    'rating_avg', (
      select rating_avg
      from public.profiles
      where id = p_pro_id
    ),
    'rating_count', (
      select coalesce(rating_count, 0)
      from public.profiles
      where id = p_pro_id
    ),
    'success_rate', (
      select case
        when count(*) = 0 then 0
        else round(100.0 * sum(case when status = 'accepted' then 1 else 0 end)::numeric / count(*), 1)
      end
      from public.applications
      where pro_id = p_pro_id
    ),
    'recent_applications', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select
          a.id,
          a.status,
          a.created_at,
          a.mission_id,
          coalesce(m.title, 'Mission') as mission_title,
          public.extract_mission_amount(m.daily_rate, m.price) as budget,
          (
            select s.id
            from public.sessions s
            where s.application_id = a.id
            order by s.created_at desc
            limit 1
          ) as session_id
        from public.applications a
        join public.missions m on m.id = a.mission_id
        where a.pro_id = p_pro_id
        order by a.created_at desc
        limit 5
      ) t
    ), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.get_applications_over_time(
  p_user_id uuid,
  p_role text
)
returns table(day date, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;

  if p_role = 'studio' then
    return query
    select date(a.created_at) as day, count(*)::bigint as count
    from public.applications a
    join public.missions m on m.id = a.mission_id
    where m.studio_id = p_user_id
      and a.created_at >= now() - interval '30 days'
    group by date(a.created_at)
    order by day;
  elsif p_role = 'pro' then
    return query
    select date(a.created_at) as day, count(*)::bigint as count
    from public.applications a
    where a.pro_id = p_user_id
      and a.created_at >= now() - interval '30 days'
    group by date(a.created_at)
    order by day;
  else
    raise exception 'Invalid role';
  end if;
end;
$$;
