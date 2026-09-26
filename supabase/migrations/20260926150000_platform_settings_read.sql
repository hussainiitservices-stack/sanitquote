-- Merchants need the default currency and tax rate when they build a quotation.
-- They can read the singleton row. Only admins can change it.

create policy platform_settings_authenticated_read
  on public.platform_settings
  for select
  to authenticated
  using (id = 1);
