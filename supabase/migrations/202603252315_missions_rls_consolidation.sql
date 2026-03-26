begin;

drop policy if exists missions_audit_select_open_or_owner on public.missions;
drop policy if exists missions_select_open on public.missions;
drop policy if exists missions_select_applicant on public.missions;

create policy missions_select_published_authenticated
on public.missions for select
using (
  auth.uid() is not null
  and status::text = any (array['open'::text, 'published'::text, 'selecting'::text])
);

create policy missions_select_owner
on public.missions for select
using (studio_id = auth.uid());

create policy missions_select_applicant
on public.missions for select
using (
  exists (
    select 1
    from public.applications a
    where a.mission_id = missions.id
      and a.pro_id = auth.uid()
  )
);

create or replace function public.get_public_studio_missions(p_studio_id uuid)
returns table (
  id uuid,
  title text,
  city text,
  location text,
  daily_rate integer,
  budget_min integer,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.title,
    m.city,
    m.location,
    m.daily_rate,
    null::integer as budget_min,
    m.status::text as status
  from public.missions m
  where m.studio_id = p_studio_id
    and m.status::text = any (array['open'::text, 'published'::text, 'selecting'::text])
  order by m.created_at desc
  limit 5;
$$;

grant execute on function public.get_public_studio_missions(uuid) to anon, authenticated;

commit;
