do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'application_status'
      and e.enumlabel = 'accepted'
  ) then
    null;
  else
    alter type public.application_status add value 'accepted';
  end if;
exception
  when duplicate_object then
    null;
end $$;
