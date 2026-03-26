alter table public.missions
  add column if not exists category text,
  add column if not exists city text,
  add column if not exists date date,
  add column if not exists end_date date,
  add column if not exists daily_rate integer,
  add column if not exists skills_required text[] not null default '{}'::text[],
  add column if not exists selected_pro_id uuid references public.profiles(id);

alter table public.missions
  alter column status set default 'open'::public.mission_status;

update public.missions
set category = coalesce(category, nullif(service_type, ''), 'Autre')
where category is null;

update public.missions
set city = coalesce(city, nullif(location, ''))
where city is null and location is not null;

update public.missions
set daily_rate = nullif(regexp_replace(coalesce(price, ''), '[^0-9]', '', 'g'), '')::integer
where daily_rate is null and price is not null;

update public.missions
set skills_required = coalesce(skills_required, genres, '{}'::text[])
where skills_required = '{}'::text[] and array_length(genres, 1) is not null;

create index if not exists idx_missions_studio_id on public.missions(studio_id);
create index if not exists idx_missions_status on public.missions(status);
create index if not exists idx_missions_city on public.missions(city);

alter table public.missions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'missions'
      and policyname = 'missions_select_open'
  ) then
    create policy "missions_select_open"
      on public.missions
      for select
      using (((status)::text = 'open') or ((status)::text = 'published') or (studio_id = auth.uid()));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'missions'
      and policyname = 'missions_insert_studio'
  ) then
    create policy "missions_insert_studio"
      on public.missions
      for insert
      with check (studio_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'missions'
      and policyname = 'missions_update_studio'
  ) then
    create policy "missions_update_studio"
      on public.missions
      for update
      using (studio_id = auth.uid())
      with check (studio_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'missions'
      and policyname = 'missions_delete_studio'
  ) then
    create policy "missions_delete_studio"
      on public.missions
      for delete
      using (studio_id = auth.uid());
  end if;
end
$$;
