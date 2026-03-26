do $$
begin
  alter type public.mission_status add value if not exists 'open';
exception
  when duplicate_object then null;
end
$$;
