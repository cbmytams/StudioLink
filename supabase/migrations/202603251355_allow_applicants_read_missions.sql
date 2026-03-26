do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'missions'
      and policyname = 'missions_select_applicant'
  ) then
    create policy missions_select_applicant
      on public.missions
      for select
      using (
        exists (
          select 1
          from public.applications as a
          where a.mission_id = missions.id
            and a.pro_id = auth.uid()
        )
      );
  end if;
end $$;
