-- Public object URLs are used for logos on quotations and later PDFs.
-- There is no anonymous list policy, so the storage API cannot enumerate files.
-- Writes are limited to the owning merchant folder, or to an admin.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'merchant-logos',
    'merchant-logos',
    true,
    2097152,
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'brand-assets',
    'brand-assets',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy merchant_logos_select_own_or_admin
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'merchant-logos'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_merchant_id()::text
    )
  );

create policy merchant_logos_insert_own_or_admin
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'merchant-logos'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_merchant_id()::text
    )
  );

create policy merchant_logos_update_own_or_admin
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'merchant-logos'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_merchant_id()::text
    )
  )
  with check (
    bucket_id = 'merchant-logos'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_merchant_id()::text
    )
  );

create policy merchant_logos_delete_own_or_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'merchant-logos'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_merchant_id()::text
    )
  );

create policy brand_assets_admin_all
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'brand-assets' and public.is_admin())
  with check (bucket_id = 'brand-assets' and public.is_admin());