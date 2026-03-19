begin;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.missions(id) on delete cascade,
  reviewer_id uuid references public.profiles(id),
  reviewee_id uuid references public.profiles(id),
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique (mission_id, reviewer_id)
);

do $$
declare
  has_unique_pair boolean;
begin
  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'reviews'
      and c.contype = 'u'
      and array_length(c.conkey, 1) = 2
      and (
        select array_agg(a.attname order by a.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a
          on a.attrelid = c.conrelid
         and a.attnum = k.attnum
      ) = array['mission_id', 'reviewer_id']
  ) into has_unique_pair;

  if not has_unique_pair then
    create unique index if not exists reviews_unique_mission_reviewer
      on public.reviews (mission_id, reviewer_id);
  end if;
end $$;

commit;
