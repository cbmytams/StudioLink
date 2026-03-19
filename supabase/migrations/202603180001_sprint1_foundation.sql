begin;

create extension if not exists pgcrypto;

do $$
begin
  create type user_type as enum ('studio', 'pro');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type mission_status as enum ('draft', 'published', 'in_progress', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type application_status as enum ('pending', 'selected', 'rejected');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type invitation_status as enum ('available', 'used');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type user_type not null,
  status invitation_status not null default 'available',
  expires_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  user_type user_type not null,
  onboarding_complete boolean not null default false,
  onboarding_step integer not null default 1,
  avatar_url text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  name text,
  address text,
  district text,
  phone text,
  description text,
  equipment text[] not null default '{}',
  website text,
  instagram text,
  updated_at timestamptz not null default now()
);

create table if not exists public.pro_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  name text,
  bio text,
  phone text,
  services text[] not null default '{}',
  genres text[] not null default '{}',
  instruments text[] not null default '{}',
  min_rate integer not null default 0,
  show_rate boolean not null default true,
  links jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.profiles(id) on delete cascade,
  is_urgent boolean not null default false,
  service_type text not null,
  artist_name text,
  is_confidential boolean not null default false,
  genres text[] not null default '{}',
  beat_type text,
  duration text,
  price text,
  location text,
  candidates_count integer not null default 0,
  expires_at timestamptz,
  status mission_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  pro_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, pro_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists studio_profiles_set_updated_at on public.studio_profiles;
create trigger studio_profiles_set_updated_at
before update on public.studio_profiles
for each row execute function public.set_updated_at();

drop trigger if exists pro_profiles_set_updated_at on public.pro_profiles;
create trigger pro_profiles_set_updated_at
before update on public.pro_profiles
for each row execute function public.set_updated_at();

drop trigger if exists missions_set_updated_at on public.missions;
create trigger missions_set_updated_at
before update on public.missions
for each row execute function public.set_updated_at();

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

alter table public.invitation_codes enable row level security;
alter table public.profiles enable row level security;
alter table public.studio_profiles enable row level security;
alter table public.pro_profiles enable row level security;
alter table public.missions enable row level security;
alter table public.applications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "studio_profiles_select_own" on public.studio_profiles;
create policy "studio_profiles_select_own"
on public.studio_profiles for select
using (auth.uid() = profile_id);

drop policy if exists "studio_profiles_upsert_own" on public.studio_profiles;
create policy "studio_profiles_upsert_own"
on public.studio_profiles for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "pro_profiles_select_own" on public.pro_profiles;
create policy "pro_profiles_select_own"
on public.pro_profiles for select
using (auth.uid() = profile_id);

drop policy if exists "pro_profiles_upsert_own" on public.pro_profiles;
create policy "pro_profiles_upsert_own"
on public.pro_profiles for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "missions_select_published_or_owner" on public.missions;
create policy "missions_select_published_or_owner"
on public.missions for select
using (status = 'published' or auth.uid() = studio_id);

drop policy if exists "missions_insert_studio_owner" on public.missions;
create policy "missions_insert_studio_owner"
on public.missions for insert
with check (
  auth.uid() = studio_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(to_jsonb(p)->>'user_type', to_jsonb(p)->>'type') = 'studio'
  )
);

drop policy if exists "missions_update_studio_owner" on public.missions;
create policy "missions_update_studio_owner"
on public.missions for update
using (auth.uid() = studio_id)
with check (auth.uid() = studio_id);

drop policy if exists "missions_delete_studio_owner" on public.missions;
create policy "missions_delete_studio_owner"
on public.missions for delete
using (auth.uid() = studio_id);

drop policy if exists "applications_select_related_users" on public.applications;
create policy "applications_select_related_users"
on public.applications for select
using (
  auth.uid() = pro_id
  or exists (
    select 1
    from public.missions m
    where m.id = applications.mission_id
      and m.studio_id = auth.uid()
  )
);

drop policy if exists "applications_insert_pro_owner" on public.applications;
create policy "applications_insert_pro_owner"
on public.applications for insert
with check (
  auth.uid() = pro_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(to_jsonb(p)->>'user_type', to_jsonb(p)->>'type') = 'pro'
  )
);

drop policy if exists "applications_update_related_users" on public.applications;
create policy "applications_update_related_users"
on public.applications for update
using (
  auth.uid() = pro_id
  or exists (
    select 1
    from public.missions m
    where m.id = applications.mission_id
      and m.studio_id = auth.uid()
  )
)
with check (
  auth.uid() = pro_id
  or exists (
    select 1
    from public.missions m
    where m.id = applications.mission_id
      and m.studio_id = auth.uid()
  )
);

drop policy if exists "applications_delete_related_users" on public.applications;
create policy "applications_delete_related_users"
on public.applications for delete
using (
  auth.uid() = pro_id
  or exists (
    select 1
    from public.missions m
    where m.id = applications.mission_id
      and m.studio_id = auth.uid()
  )
);

create or replace function public.validate_invitation_code(p_code text)
returns table(is_valid boolean, code_type user_type, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.invitation_codes;
begin
  select *
  into v_record
  from public.invitation_codes
  where upper(code) = upper(trim(p_code))
  limit 1;

  if not found then
    return query select false, null::user_type, 'Code introuvable';
    return;
  end if;

  if v_record.status <> 'available' then
    return query select false, v_record.type, 'Code déjà utilisé';
    return;
  end if;

  if v_record.expires_at is not null and v_record.expires_at <= now() then
    return query select false, v_record.type, 'Code expiré';
    return;
  end if;

  return query select true, v_record.type, 'Code valide';
end
$$;

grant execute on function public.validate_invitation_code(text) to anon, authenticated;

create or replace function public.consume_invitation_code(p_code text, p_user_id uuid)
returns user_type
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type user_type;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> p_user_id then
    raise exception 'User mismatch';
  end if;

  update public.invitation_codes
  set status = 'used',
      used_by = p_user_id,
      used_at = now()
  where upper(code) = upper(trim(p_code))
    and status = 'available'
    and (expires_at is null or expires_at > now())
  returning type into v_type;

  if v_type is null then
    raise exception 'Code invalide, expiré ou déjà utilisé';
  end if;

  return v_type;
end
$$;

grant execute on function public.consume_invitation_code(text, uuid) to authenticated;

insert into public.invitation_codes (code, type, status, expires_at)
values
  ('STUDIO2024', 'studio', 'available', now() + interval '90 days'),
  ('STUDIOADMIN', 'studio', 'available', null),
  ('PRO2024', 'pro', 'available', now() + interval '90 days'),
  ('PROADMIN', 'pro', 'available', null)
on conflict (code) do nothing;

commit;
