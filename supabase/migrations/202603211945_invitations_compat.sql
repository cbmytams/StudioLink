begin;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type user_type not null,
  email text,
  used boolean not null default false,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists invitations_code_unique_idx
  on public.invitations (upper(code));

do $$
begin
  if to_regclass('public.invitation_codes') is not null then
    insert into public.invitations (code, type, used, used_by, used_at, expires_at, created_at)
    select
      ic.code,
      ic.type,
      (ic.status::text = 'used') as used,
      ic.used_by,
      ic.used_at,
      ic.expires_at,
      ic.created_at
    from public.invitation_codes ic
    where not exists (
      select 1
      from public.invitations i
      where upper(i.code) = upper(ic.code)
    );
  end if;
end
$$;

alter table public.invitations enable row level security;

drop policy if exists invitations_public_select on public.invitations;
create policy invitations_public_select
on public.invitations
for select
using (true);

drop policy if exists invitations_admin_all on public.invitations;
create policy invitations_admin_all
on public.invitations
for all
using (public.is_admin_user_secure())
with check (public.is_admin_user_secure());

commit;
