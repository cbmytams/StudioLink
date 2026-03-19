begin;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles alter column type drop not null';
  end if;
end
$$;

create or replace function public.sync_profile_type_bridge()
returns trigger
language plpgsql
as $$
begin
  if new.type is null and new.user_type is not null then
    new.type := (new.user_type::text)::profile_type;
  end if;

  if new.user_type is null and new.type is not null then
    new.user_type := (new.type::text)::user_type;
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute '
      update public.profiles
      set type = (user_type::text)::profile_type
      where type is null and user_type is not null
    ';
    execute 'drop trigger if exists profiles_sync_type_bridge on public.profiles';
    execute 'create trigger profiles_sync_type_bridge before insert or update on public.profiles for each row execute function public.sync_profile_type_bridge()';
  end if;
end
$$;

commit;
