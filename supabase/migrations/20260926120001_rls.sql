-- Merchant isolation.
-- Merchants can read and write only rows whose merchant_id is their own.
-- Catalog tables are global. Merchants can read products only for companies
-- granted in merchant_company_access.
-- Admins can operate the platform, including tenant rows, for support.
-- The service role bypasses RLS and is reserved for server-side provisioning.

alter table public.merchants enable row level security;
alter table public.merchant_branding enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.merchant_company_access enable row level security;
alter table public.clients enable row level security;
alter table public.sites enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;

revoke all on table
  public.merchants,
  public.merchant_branding,
  public.profiles,
  public.companies,
  public.products,
  public.merchant_company_access,
  public.clients,
  public.sites,
  public.quotations,
  public.quotation_items
from anon;

grant select, insert, update, delete on table
  public.merchants,
  public.merchant_branding,
  public.profiles,
  public.companies,
  public.products,
  public.merchant_company_access,
  public.clients,
  public.sites,
  public.quotations,
  public.quotation_items
to authenticated, service_role;

-- Profiles. Inserts come from the auth trigger, which bypasses RLS.
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Merchants. Subscription columns stay admin-write because merchants have no update policy.
create policy merchants_select_own_or_admin
  on public.merchants
  for select
  to authenticated
  using (public.is_admin() or id = public.current_merchant_id());

create policy merchants_admin_insert
  on public.merchants
  for insert
  to authenticated
  with check (public.is_admin());

create policy merchants_admin_update
  on public.merchants
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy merchants_admin_delete
  on public.merchants
  for delete
  to authenticated
  using (public.is_admin());

create policy merchant_branding_select_own_or_admin
  on public.merchant_branding
  for select
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id());

create policy merchant_branding_insert_own_or_admin
  on public.merchant_branding
  for insert
  to authenticated
  with check (public.is_admin() or merchant_id = public.current_merchant_id());

create policy merchant_branding_update_own_or_admin
  on public.merchant_branding
  for update
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id())
  with check (public.is_admin() or merchant_id = public.current_merchant_id());

create policy merchant_branding_admin_delete
  on public.merchant_branding
  for delete
  to authenticated
  using (public.is_admin());

-- Global catalog.
create policy companies_admin_all
  on public.companies
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy companies_merchant_read_granted
  on public.companies
  for select
  to authenticated
  using (
    is_active
    and exists (
      select 1
      from public.merchant_company_access as access
      where access.company_id = companies.id
        and access.merchant_id = public.current_merchant_id()
    )
  );

create policy products_admin_all
  on public.products
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy products_merchant_read_granted
  on public.products
  for select
  to authenticated
  using (
    is_active
    and exists (
      select 1
      from public.merchant_company_access as access
      join public.companies as company on company.id = access.company_id
      where access.company_id = products.company_id
        and access.merchant_id = public.current_merchant_id()
        and company.is_active
    )
  );

create policy merchant_company_access_select_own_or_admin
  on public.merchant_company_access
  for select
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id());

create policy merchant_company_access_admin_write
  on public.merchant_company_access
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tenant data. Expired or suspended merchants can still read history.
-- Inserts, updates, and deletes require an active subscription.
create policy clients_select_own_or_admin
  on public.clients
  for select
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id());

create policy clients_write_active_or_admin
  on public.clients
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy clients_update_active_or_admin
  on public.clients
  for update
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id())
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy clients_delete_active_or_admin
  on public.clients
  for delete
  to authenticated
  using (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy sites_select_own_or_admin
  on public.sites
  for select
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id());

create policy sites_insert_active_or_admin
  on public.sites
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy sites_update_active_or_admin
  on public.sites
  for update
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id())
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy sites_delete_active_or_admin
  on public.sites
  for delete
  to authenticated
  using (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy quotations_select_own_or_admin
  on public.quotations
  for select
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id());

create policy quotations_insert_active_or_admin
  on public.quotations
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy quotations_update_active_or_admin
  on public.quotations
  for update
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id())
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy quotations_delete_active_or_admin
  on public.quotations
  for delete
  to authenticated
  using (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy quotation_items_select_own_or_admin
  on public.quotation_items
  for select
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id());

create policy quotation_items_insert_active_or_admin
  on public.quotation_items
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy quotation_items_update_active_or_admin
  on public.quotation_items
  for update
  to authenticated
  using (public.is_admin() or merchant_id = public.current_merchant_id())
  with check (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );

create policy quotation_items_delete_active_or_admin
  on public.quotation_items
  for delete
  to authenticated
  using (
    public.is_admin()
    or (
      merchant_id = public.current_merchant_id()
      and public.merchant_subscription_active(merchant_id)
    )
  );
