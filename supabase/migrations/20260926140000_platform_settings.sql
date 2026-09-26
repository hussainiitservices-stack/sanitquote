-- Basic platform settings used by the admin panel.
-- Admin access matches the existing admin policies on the other tables.

create table public.platform_settings (
  id integer primary key default 1,
  platform_name text not null default 'SanitQuote',
  support_email text,
  default_currency text not null default 'INR',
  default_tax_rate numeric(5, 2) not null default 18,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id = 1),
  constraint platform_settings_currency check (default_currency ~ '^[A-Z]{3}$'),
  constraint platform_settings_tax check (default_tax_rate >= 0 and default_tax_rate <= 100)
);

insert into public.platform_settings (id) values (1);

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

revoke all on table public.platform_settings from anon;
grant select, insert, update on table public.platform_settings to authenticated;
grant all on table public.platform_settings to service_role;

create policy platform_settings_admin_all
  on public.platform_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
