begin;

update storage.buckets
set file_size_limit = 5242880 -- 5 MB
where id = 'avatars';

update storage.buckets
set file_size_limit = 10485760 -- 10 MB
where id = 'mission-files';

update storage.buckets
set file_size_limit = 52428800 -- 50 MB
where id = 'delivery-files';

update storage.buckets
set file_size_limit = 10485760 -- 10 MB
where id = 'message-files';

commit;
