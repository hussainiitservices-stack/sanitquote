# SanitQuote

Mobile-first workspace for sanitaryware quotations. Admins keep one product catalog. Each merchant quotes only from the brands they are allowed to use, and their clients, sites, and quotations stay on their own account.

## Stack

Next.js App Router, TypeScript, Supabase Postgres, Supabase Auth, Supabase Storage, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key, and service role key.
2. Apply the SQL in `supabase/migrations` in order, in the Supabase SQL editor or with `supabase db push`.
3. In Supabase Auth, turn off public sign-up. Accounts are created by an admin.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

### First admin

Create the auth user with the service role and `app_metadata.role` set to `admin`. The `handle_new_user` trigger copies that into `profiles`. If the user already exists, promote them from the SQL editor:

```sql
update public.profiles
set role = 'admin', merchant_id = null
where id = '<user-uuid>';
```

`lib/auth/provision.ts` is the server-side helper for creating admin and merchant logins. It writes the role into `app_metadata`, which end users cannot edit.

### Merchant login

Insert the `merchants` row first. Branding is created automatically. Then create the auth user with:

```json
{ "role": "merchant", "merchant_id": "<merchant-uuid>" }
```

## Routes

| Path | Who |
| --- | --- |
| `/` | Public introduction |
| `/login` | Email and password sign-in |
| `/admin` | Platform: merchants, brands, products, access |
| `/merchant` | Showroom: clients, sites, quotations, catalog, branding |

`/api/health` is public. `/api/session` returns the signed-in profile.

## Tenancy

- `companies` and `products` are global. Admins write them.
- `merchant_company_access` decides which brands a merchant can read.
- `clients`, `sites`, `quotations`, and `quotation_items` all carry `merchant_id`.
- Row level security lets a merchant touch only their own rows. Writes to those tables also require an active subscription (`status = active` and today inside `subscription_starts_on` / `subscription_ends_on`).
- Platform admins can read tenant rows for support. The service role bypasses RLS and stays on the server.

Quotations copy client, site, branding, and line prices into snapshot columns. Later PDF generation should use `lib/pdf/quotation-document.ts` and those columns, not the live catalog.

## Storage

- `merchant-logos`: `{merchant_id}/{filename}`, public URL, merchant can write only their folder.
- `brand-assets`: company and product images, admin write, public URL. There is no list policy, so the bucket cannot be enumerated.

## Not built yet

Merchant and product management screens, quotation editing, and PDF rendering. The routes are placeholders on top of the schema, auth, and layout.
