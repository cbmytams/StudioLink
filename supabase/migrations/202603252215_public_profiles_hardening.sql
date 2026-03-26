begin;

create or replace view public.public_profiles as
select
  p.id,
  coalesce(
    nullif(trim(p.display_name), ''),
    nullif(trim(p.company_name), ''),
    nullif(trim(p.full_name), ''),
    nullif(trim(p.username), '')
  ) as display_name,
  p.avatar_url,
  coalesce(p.type::text, p.user_type::text) as role,
  p.bio,
  p.city as location,
  coalesce(p.skills, '{}'::text[]) as skills,
  p.daily_rate,
  p.rating_avg,
  coalesce(p.rating_count, 0) as rating_count
from public.profiles p;

revoke all on table public.public_profiles from public;
grant select on table public.public_profiles to anon, authenticated;

alter table public.profiles enable row level security;

drop policy if exists profiles_audit_select_public on public.profiles;
drop policy if exists profiles_select_public on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

create policy profiles_select_own
on public.profiles for select
using (auth.uid() = id);

drop function if exists public.search_pros(text, text, text, int, int);

create or replace function public.search_pros(
  p_query text default null,
  p_location text default null,
  p_skill text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  role text,
  bio text,
  location text,
  skills text[],
  daily_rate integer,
  rating_avg numeric,
  rating_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    pp.id,
    pp.display_name,
    pp.avatar_url,
    pp.role,
    pp.bio,
    pp.location,
    pp.skills,
    pp.daily_rate,
    pp.rating_avg,
    pp.rating_count
  from public.public_profiles pp
  join public.profiles p
    on p.id = pp.id
  where
    pp.role = 'pro'
    and coalesce(p.is_public, true) = true
    and (
      p_query is null
      or p_query = ''
      or coalesce(p.search_vector, ''::tsvector) @@ plainto_tsquery('french', p_query)
    )
    and (
      p_location is null
      or p_location = ''
      or coalesce(pp.location, '') ilike '%' || p_location || '%'
    )
    and (
      p_skill is null
      or p_skill = ''
      or exists (
        select 1
        from unnest(coalesce(pp.skills, '{}'::text[])) as skill
        where skill ilike '%' || p_skill || '%'
      )
    )
  order by
    case
      when p_query is not null and p_query <> ''
        then ts_rank(coalesce(p.search_vector, ''::tsvector), plainto_tsquery('french', p_query))
      else 0
    end desc,
    pp.rating_avg desc nulls last,
    p.created_at desc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_pros(text, text, text, int, int) to authenticated;

commit;
