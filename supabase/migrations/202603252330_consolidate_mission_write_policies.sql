begin;

drop policy if exists missions_audit_insert_owner on public.missions;
drop policy if exists missions_insert_owner on public.missions;
drop policy if exists missions_insert_studio on public.missions;

drop policy if exists missions_audit_update_owner on public.missions;
drop policy if exists missions_update_owner on public.missions;
drop policy if exists missions_update_studio on public.missions;

drop policy if exists missions_audit_delete_owner on public.missions;
drop policy if exists missions_delete_studio on public.missions;

commit;
