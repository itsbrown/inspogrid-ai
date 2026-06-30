-- InspoGrid AI Phase 0: storage bucket + RLS
-- Path convention: {user_id}/{project_id}/{image_id}.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Users upload to their own folder
create policy "Users upload own project images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users read their own images
create policy "Users read own project images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users delete their own images
create policy "Users delete own project images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users update their own images
create policy "Users update own project images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );