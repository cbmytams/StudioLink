begin;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles add column if not exists email text';
    execute 'alter table public.profiles add column if not exists user_type user_type';
    execute 'alter table public.profiles add column if not exists onboarding_complete boolean not null default false';
    execute 'alter table public.profiles add column if not exists onboarding_step integer not null default 1';
    execute 'alter table public.profiles add column if not exists display_name text';
    execute 'alter table public.profiles add column if not exists updated_at timestamptz not null default now()';
    execute 'alter table public.profiles add column if not exists company_name text';
    execute 'alter table public.profiles add column if not exists website text';
    execute 'alter table public.profiles add column if not exists bio text';
    execute 'alter table public.profiles add column if not exists contact_email text';
    execute 'alter table public.profiles add column if not exists username text';
    execute 'alter table public.profiles add column if not exists skills text[] not null default ''{}''';
    execute 'alter table public.profiles add column if not exists daily_rate integer';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.profiles') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'profiles'
         and column_name = 'type'
     ) then
    execute $sql$
      update public.profiles
      set user_type = case
        when type::text = 'studio' then 'studio'::user_type
        when type::text = 'pro' then 'pro'::user_type
        else user_type
      end
      where user_type is null
    $sql$;
  end if;
end
$$;

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

do $$
begin
  if to_regclass('public.invitations') is not null
     and exists (
       select 1
       from pg_constraint
       where conname = 'invitations_used_by_fkey'
         and conrelid = 'public.invitations'::regclass
     ) then
    execute 'alter table public.invitations drop constraint invitations_used_by_fkey';
    execute 'alter table public.invitations add constraint invitations_used_by_fkey foreign key (used_by) references auth.users(id) on delete set null';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.set_updated_at') is null then
    execute $fn$
      create function public.set_updated_at()
      returns trigger
      language plpgsql
      as $inner$
      begin
        new.updated_at = now();
        return new;
      end
      $inner$
    $fn$;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists profiles_set_updated_at on public.profiles';
    execute 'create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at()';
  end if;
end
$$;

commit;
