-- Avatar storage bucket + policies

insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (
  select 1
  from storage.buckets
  where id = 'avatars'
);

update storage.buckets
set public = true
where id = 'avatars';

drop policy if exists "avatars publics" on storage.objects;
create policy "avatars publics"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "upload avatar owner" on storage.objects;
create policy "upload avatar owner"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "delete avatar owner" on storage.objects;
create policy "delete avatar owner"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
