alter table public.missions
  add column if not exists search_vector tsvector;

alter table public.profiles
  add column if not exists search_vector tsvector,
  add column if not exists is_public boolean default true;

create or replace function public.update_mission_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector(
    'french',
    trim(
      both ' '
      from concat_ws(
        ' ',
        coalesce(new.title, ''),
        coalesce(new.description, ''),
        coalesce(new.category, ''),
        coalesce(new.service_type, ''),
        coalesce(new.location, ''),
        coalesce(new.city, ''),
        coalesce(array_to_string(coalesce(new.genres, '{}'::text[]), ' '), ''),
        coalesce(array_to_string(coalesce(new.skills_required, '{}'::text[]), ' '), '')
      )
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_mission_search_vector on public.missions;
create trigger trg_mission_search_vector
before insert or update on public.missions
for each row execute function public.update_mission_search_vector();

update public.missions
set search_vector = to_tsvector(
  'french',
  trim(
    both ' '
    from concat_ws(
      ' ',
      coalesce(title, ''),
      coalesce(description, ''),
      coalesce(category, ''),
      coalesce(service_type, ''),
      coalesce(location, ''),
      coalesce(city, ''),
      coalesce(array_to_string(coalesce(genres, '{}'::text[]), ' '), ''),
      coalesce(array_to_string(coalesce(skills_required, '{}'::text[]), ' '), '')
    )
  )
)
where search_vector is null;

create index if not exists idx_missions_search on public.missions using gin (search_vector);

create or replace function public.update_profile_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector(
    'french',
    trim(
      both ' '
      from concat_ws(
        ' ',
        coalesce(new.full_name, ''),
        coalesce(new.display_name, ''),
        coalesce(new.company_name, ''),
        coalesce(new.bio, ''),
        coalesce(new.city, ''),
        coalesce(array_to_string(coalesce(new.skills, '{}'::text[]), ' '), '')
      )
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_profile_search_vector on public.profiles;
create trigger trg_profile_search_vector
before insert or update on public.profiles
for each row execute function public.update_profile_search_vector();

update public.profiles
set search_vector = to_tsvector(
  'french',
  trim(
    both ' '
    from concat_ws(
      ' ',
      coalesce(full_name, ''),
      coalesce(display_name, ''),
      coalesce(company_name, ''),
      coalesce(bio, ''),
      coalesce(city, ''),
      coalesce(array_to_string(coalesce(skills, '{}'::text[]), ' '), '')
    )
  )
)
where search_vector is null;

create index if not exists idx_profiles_search on public.profiles using gin (search_vector);

create or replace function public.search_missions(
  p_query text default null,
  p_genre text default null,
  p_location text default null,
  p_budget_min numeric default null,
  p_budget_max numeric default null,
  p_status text default 'published',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  studio_id uuid,
  title text,
  description text,
  category text,
  service_type text,
  genres text[],
  location text,
  city text,
  date date,
  daily_rate integer,
  price text,
  created_at timestamptz,
  status text,
  applications_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with mission_base as (
    select
      m.id,
      m.studio_id,
      m.title,
      m.description,
      m.category,
      m.service_type,
      m.genres,
      m.location,
      m.city,
      m.date,
      m.daily_rate,
      m.price,
      m.created_at,
      m.status::text as status,
      coalesce(m.applications_count, m.candidates_count, 0) as applications_count,
      m.search_vector,
      coalesce(
        m.daily_rate::numeric,
        nullif(regexp_replace(coalesce(m.price, ''), '\D', '', 'g'), '')::numeric
      ) as searchable_budget
    from public.missions m
  )
  select
    mb.id,
    mb.studio_id,
    mb.title,
    mb.description,
    mb.category,
    mb.service_type,
    mb.genres,
    mb.location,
    mb.city,
    mb.date,
    mb.daily_rate,
    mb.price,
    mb.created_at,
    mb.status,
    mb.applications_count
  from mission_base mb
  where
    (
      p_status is null
      or (p_status in ('published', 'open') and mb.status in ('open', 'published'))
      or (p_status not in ('published', 'open') and mb.status = p_status)
    )
    and (
      p_query is null
      or p_query = ''
      or coalesce(mb.search_vector, ''::tsvector) @@ plainto_tsquery('french', p_query)
    )
    and (
      p_genre is null
      or p_genre = ''
      or coalesce(mb.category, '') ilike '%' || p_genre || '%'
      or coalesce(mb.service_type, '') ilike '%' || p_genre || '%'
      or exists (
        select 1
        from unnest(coalesce(mb.genres, '{}'::text[])) as genre
        where genre ilike '%' || p_genre || '%'
      )
    )
    and (
      p_location is null
      or p_location = ''
      or coalesce(mb.city, mb.location, '') ilike '%' || p_location || '%'
    )
    and (p_budget_min is null or mb.searchable_budget >= p_budget_min)
    and (p_budget_max is null or mb.searchable_budget <= p_budget_max)
  order by
    case
      when p_query is not null and p_query <> ''
        then ts_rank(coalesce(mb.search_vector, ''::tsvector), plainto_tsquery('french', p_query))
      else 0
    end desc,
    mb.created_at desc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_missions(text, text, text, numeric, numeric, text, int, int) to authenticated;

create or replace function public.search_pros(
  p_query text default null,
  p_location text default null,
  p_skill text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  email text,
  user_type public.user_type,
  onboarding_complete boolean,
  onboarding_step integer,
  avatar_url text,
  display_name text,
  created_at timestamptz,
  updated_at timestamptz,
  notification_preferences jsonb,
  company_name text,
  website text,
  bio text,
  contact_email text,
  username text,
  skills text[],
  daily_rate integer,
  full_name text,
  city text,
  type public.user_type,
  rating_avg numeric,
  rating_count integer,
  search_vector tsvector,
  is_public boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id,
    p.email,
    p.user_type,
    p.onboarding_complete,
    p.onboarding_step,
    p.avatar_url,
    p.display_name,
    p.created_at,
    p.updated_at,
    p.notification_preferences,
    p.company_name,
    p.website,
    p.bio,
    p.contact_email,
    p.username,
    p.skills,
    p.daily_rate,
    p.full_name,
    p.city,
    p.type,
    p.rating_avg,
    p.rating_count,
    p.search_vector,
    coalesce(p.is_public, true) as is_public
  from public.profiles p
  where
    coalesce(p.type::text, p.user_type::text) = 'pro'
    and coalesce(p.is_public, true) = true
    and (
      p_query is null
      or p_query = ''
      or coalesce(p.search_vector, ''::tsvector) @@ plainto_tsquery('french', p_query)
    )
    and (
      p_location is null
      or p_location = ''
      or coalesce(p.city, '') ilike '%' || p_location || '%'
    )
    and (
      p_skill is null
      or p_skill = ''
      or exists (
        select 1
        from unnest(coalesce(p.skills, '{}'::text[])) as skill
        where skill ilike '%' || p_skill || '%'
      )
    )
  order by
    case
      when p_query is not null and p_query <> ''
        then ts_rank(coalesce(p.search_vector, ''::tsvector), plainto_tsquery('french', p_query))
      else 0
    end desc,
    p.rating_avg desc nulls last,
    p.created_at desc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_pros(text, text, text, int, int) to authenticated;
