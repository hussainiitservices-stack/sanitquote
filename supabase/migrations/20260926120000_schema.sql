-- SanitQuote foundation schema.
-- Products belong to global companies and are managed by admins.
-- Merchant-owned rows carry merchant_id. Quotations store snapshots so later
-- catalog edits do not rewrite a quote that was already created.

create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'merchant', 'pending');
create type public.merchant_status as enum ('active', 'suspended');
create type public.quotation_status as enum (
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'cancelled'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status public.merchant_status not null default 'active',
  subscription_starts_on date not null,
  subscription_ends_on date not null,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint merchants_subscription_window check (subscription_ends_on >= subscription_starts_on),
  constraint merchants_slug_key unique (slug)
);

comment on table public.merchants is
  'Tenant account. Subscription dates are admin-managed. Operational data lives in child tables keyed by id.';

create table public.merchant_branding (
  merchant_id uuid primary key references public.merchants (id) on delete cascade,
  display_name text not null,
  tagline text,
  logo_path text,
  primary_color text not null default '#123c3e',
  secondary_color text not null default '#f4f1ea',
  accent_color text not null default '#8a6232',
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  website text,
  gstin text,
  footer_note text,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_branding_primary_color_hex check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint merchant_branding_secondary_color_hex check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint merchant_branding_accent_color_hex check (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on column public.merchant_branding.logo_path is
  'Object path inside the merchant-logos bucket: {merchant_id}/{filename}.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'pending',
  merchant_id uuid references public.merchants (id) on delete restrict,
  full_name text not null default '',
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_key unique (email),
  constraint profiles_role_scope_check check (
    (role = 'admin' and merchant_id is null)
    or (role = 'merchant' and merchant_id is not null)
    or (role = 'pending' and merchant_id is null)
  )
);

comment on table public.profiles is
  'App profile for an auth user. Role is copied from auth app_metadata, which only the service role can set.';

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_path text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint companies_slug_key unique (slug)
);

comment on table public.companies is
  'Global sanitaryware brands. Admins own this catalog. Merchants never write it.';

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  sku text not null,
  name text not null,
  description text,
  category text,
  finish text,
  unit text not null default 'pcs',
  hsn_code text,
  list_price numeric(12, 2) not null,
  currency text not null default 'INR',
  specifications jsonb not null default '{}'::jsonb,
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_company_sku_key unique (company_id, sku),
  constraint products_list_price_nonnegative check (list_price >= 0),
  constraint products_currency_code check (currency ~ '^[A-Z]{3}$')
);

comment on column public.products.image_path is
  'Object path inside the brand-assets bucket.';

create table public.merchant_company_access (
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  primary key (merchant_id, company_id)
);

comment on table public.merchant_company_access is
  'Companies a merchant is allowed to quote from. Admins grant and revoke rows.';

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  gstin text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  pincode text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  site_id uuid references public.sites (id) on delete set null,
  quotation_number text not null,
  status public.quotation_status not null default 'draft',
  issue_date date not null default current_date,
  valid_until date,
  currency text not null default 'INR',
  notes text,
  terms text,
  client_name text not null,
  client_phone text,
  client_email text,
  client_address text,
  client_gstin text,
  site_name text,
  site_address text,
  branding_display_name text not null,
  branding_logo_path text,
  branding_primary_color text,
  branding_secondary_color text,
  branding_accent_color text,
  branding_phone text,
  branding_email text,
  branding_address text,
  branding_gstin text,
  branding_website text,
  branding_footer_note text,
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_number_per_merchant unique (merchant_id, quotation_number),
  constraint quotations_currency_code check (currency ~ '^[A-Z]{3}$'),
  constraint quotations_totals_nonnegative check (
    subtotal >= 0
    and discount_total >= 0
    and tax_total >= 0
    and grand_total >= 0
  )
);

comment on table public.quotations is
  'Merchant quote. Client, site, branding, and totals are snapshots taken at creation. PDF rendering must read these columns, not live product prices.';

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  sort_order integer not null default 0,
  company_name text not null,
  product_name text not null,
  sku text,
  description text,
  unit text not null default 'pcs',
  unit_price numeric(12, 2) not null,
  quantity numeric(12, 3) not null,
  discount_amount numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0,
  line_subtotal numeric(12, 2) not null,
  line_tax numeric(12, 2) not null,
  line_total numeric(12, 2) not null,
  specifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint quotation_items_price_nonnegative check (unit_price >= 0),
  constraint quotation_items_quantity_positive check (quantity > 0),
  constraint quotation_items_discount_nonnegative check (discount_amount >= 0),
  constraint quotation_items_tax_rate_range check (tax_rate >= 0 and tax_rate <= 100),
  constraint quotation_items_line_totals_nonnegative check (
    line_subtotal >= 0
    and line_tax >= 0
    and line_total >= 0
  )
);

comment on table public.quotation_items is
  'Line snapshot. company_name, product_name, sku, unit_price, and specifications stay as stored even if the catalog row changes or is removed.';

create index merchants_status_idx on public.merchants (status);
create index profiles_merchant_id_idx on public.profiles (merchant_id);
create index products_company_id_idx on public.products (company_id);
create index products_active_company_idx on public.products (company_id) where is_active;
create index products_sku_idx on public.products (sku);
create index merchant_company_access_company_idx on public.merchant_company_access (company_id);
create index clients_merchant_id_idx on public.clients (merchant_id);
create index sites_merchant_id_idx on public.sites (merchant_id);
create index sites_client_id_idx on public.sites (client_id);
create index quotations_merchant_created_idx on public.quotations (merchant_id, created_at desc);
create index quotations_merchant_status_idx on public.quotations (merchant_id, status);
create index quotations_client_id_idx on public.quotations (client_id);
create index quotations_site_id_idx on public.quotations (site_id);
create index quotation_items_quotation_idx on public.quotation_items (quotation_id, sort_order);
create index quotation_items_merchant_id_idx on public.quotation_items (merchant_id);

create trigger merchants_set_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

create trigger merchant_branding_set_updated_at
  before update on public.merchant_branding
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

create or replace function public.create_merchant_branding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.merchant_branding (merchant_id, display_name)
  values (new.id, new.name);
  return new;
end;
$$;

create trigger merchants_create_branding
  after insert on public.merchants
  for each row execute function public.create_merchant_branding();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  requested_merchant uuid;
  resolved_role public.user_role;
begin
  -- app_metadata is writable only by the service role. Ignore user_metadata for role.
  requested_role := coalesce(new.raw_app_meta_data ->> 'role', 'pending');

  begin
    requested_merchant := nullif(new.raw_app_meta_data ->> 'merchant_id', '')::uuid;
  exception
    when invalid_text_representation then
      requested_merchant := null;
  end;

  if requested_role = 'admin' then
    resolved_role := 'admin';
    requested_merchant := null;
  elsif requested_role = 'merchant' and requested_merchant is not null then
    resolved_role := 'merchant';
  else
    resolved_role := 'pending';
    requested_merchant := null;
  end if;

  insert into public.profiles (id, role, merchant_id, full_name, email)
  values (
    new.id,
    resolved_role,
    requested_merchant,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id
    and email is distinct from new.email;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.current_merchant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select merchant_id
  from public.profiles
  where id = auth.uid()
    and role = 'merchant';
$$;

create or replace function public.merchant_subscription_active(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.merchants
    where id = target
      and status = 'active'
      and subscription_starts_on <= current_date
      and subscription_ends_on >= current_date
  );
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
    or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.merchant_id is distinct from old.merchant_id
    or new.id is distinct from old.id
    or new.email is distinct from old.email then
    raise exception 'Profile role, merchant, and email are managed by an administrator';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

create or replace function public.assert_site_merchant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  client_merchant uuid;
begin
  select merchant_id into client_merchant
  from public.clients
  where id = new.client_id;

  if client_merchant is null or client_merchant is distinct from new.merchant_id then
    raise exception 'Site merchant must match the client merchant';
  end if;

  return new;
end;
$$;

create trigger sites_assert_merchant
  before insert or update on public.sites
  for each row execute function public.assert_site_merchant();

create or replace function public.assert_quotation_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  client_changed boolean;
  site_changed boolean;
begin
  if tg_op = 'INSERT' then
    client_changed := true;
    site_changed := true;
  else
    client_changed := new.client_id is distinct from old.client_id;
    site_changed := new.site_id is distinct from old.site_id;
  end if;

  if new.client_id is not null and client_changed then
    select merchant_id into owner from public.clients where id = new.client_id;
    if owner is distinct from new.merchant_id then
      raise exception 'Quotation client must belong to the same merchant';
    end if;
  end if;

  if new.site_id is not null and site_changed then
    select merchant_id into owner from public.sites where id = new.site_id;
    if owner is distinct from new.merchant_id then
      raise exception 'Quotation site must belong to the same merchant';
    end if;
  end if;

  return new;
end;
$$;

create trigger quotations_assert_scope
  before insert or update on public.quotations
  for each row execute function public.assert_quotation_scope();

create or replace function public.assert_quotation_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_merchant uuid;
  product_changed boolean;
begin
  select merchant_id into parent_merchant
  from public.quotations
  where id = new.quotation_id;

  if parent_merchant is null or parent_merchant is distinct from new.merchant_id then
    raise exception 'Quotation item merchant must match the quotation';
  end if;

  if tg_op = 'INSERT' then
    product_changed := true;
  else
    product_changed := new.product_id is distinct from old.product_id;
  end if;

  if new.product_id is not null
    and product_changed
    and not public.is_admin()
    and not exists (
      select 1
      from public.products as product
      join public.companies as company on company.id = product.company_id
      join public.merchant_company_access as access
        on access.company_id = company.id
        and access.merchant_id = new.merchant_id
      where product.id = new.product_id
        and product.is_active
        and company.is_active
    ) then
    raise exception 'Product is not available to this merchant';
  end if;

  return new;
end;
$$;

create trigger quotation_items_assert_scope
  before insert or update on public.quotation_items
  for each row execute function public.assert_quotation_item();

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.create_merchant_branding() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.protect_profile_privileges() from public, anon, authenticated;
revoke all on function public.assert_site_merchant() from public, anon, authenticated;
revoke all on function public.assert_quotation_scope() from public, anon, authenticated;
revoke all on function public.assert_quotation_item() from public, anon, authenticated;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.current_merchant_id() from public, anon;
revoke all on function public.merchant_subscription_active(uuid) from public, anon;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.current_merchant_id() to authenticated, service_role;
grant execute on function public.merchant_subscription_active(uuid) to authenticated, service_role;
