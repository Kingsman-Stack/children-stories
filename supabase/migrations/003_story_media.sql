insert into storage.buckets (id, name, public)
values ('story-media', 'story-media', false)
on conflict (id) do nothing;

create policy "parents upload their story media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "parents read their story media" on storage.objects
  for select to authenticated
  using (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "parents delete their story media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text);
