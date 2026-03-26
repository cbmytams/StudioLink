begin;

drop policy if exists invitations_public_select on public.invitations;

update storage.buckets
set
  public = false,
  file_size_limit = coalesce(file_size_limit, 524288000),
  allowed_mime_types = coalesce(
    allowed_mime_types,
    array[
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]::text[]
  )
where id = 'message-files';

drop policy if exists "message files public" on storage.objects;

create policy "message files participants"
on storage.objects for select
using (
  bucket_id = 'message-files'
  and exists (
    select 1
    from public.messages m
    where (
      m.file_url = objects.name
      or m.file_url like '%' || objects.name
    )
    and (
      (
        m.session_id is not null
        and exists (
          select 1
          from public.sessions s
          where s.id = m.session_id
            and (s.studio_id = auth.uid() or s.pro_id = auth.uid())
        )
      )
      or (
        m.conversation_id is not null
        and exists (
          select 1
          from public.conversations c
          where c.id = m.conversation_id
            and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
        )
      )
    )
  )
);

commit;
