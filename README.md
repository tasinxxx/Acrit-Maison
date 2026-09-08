# Acrit Maison

A production-ready e-commerce storefront and admin dashboard for a small-batch
jewelry brand. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4,
Prisma and PostgreSQL.

## Honest-by-default policy

This codebase deliberately contains **no simulated payments, no fake reviews,
no fabricated inventory and no fake certifications.**

- **Payments** — Stripe is optional. Without `STRIPE_SECRET_KEY`, card payments
  are disabled and checkout clearly offers bank transfer only. With keys set,
  checkout creates a *real* Stripe Checkout Session and the webhook
  (`/api/webhooks/stripe`) verifies signatures before marking orders paid.
- **Reviews** — only signed-in customers with a PAID+ order containing the
  product can review; every review is held in PENDING until an admin approves
  it. No reviews are seeded.
- **Inventory** — every stock number comes from the database. Stock is
  decremented atomically at order creation (with a `stock >= qty` guard) and
  restored when an order is cancelled/refunded or reaped unpaid after 24 h.
- **Email** — when no SMTP provider is configured, confirmations are written to
  the server log and the UI never claims an email was sent.

## Quick start

```bash
npm install
npx prisma db push        # create SQLite database
npm run db:seed           # seed categories, products, settings, admin user
npm run dev               # http://localhost:3000
```

The seed creates an admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`.env` (defaults: `admin@acritmaison.example` / `change-me-immediately` —
**change these before any real deployment**).

## Scripts

| Script             | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Development server                   |
| `npm run build`    | Production build (runs prisma generate) |
| `npm run typecheck`| TypeScript check                     |
| `npm run db:push`  | Sync Prisma schema to the database   |
| `npm run db:seed`  | Seed the database                    |

## Architecture

- `src/lib/pricing.ts` — all money is computed **server-side** from DB state;
  client-supplied prices are never trusted. VAT is reported as the portion
  included in the total (VAT-inclusive pricing).
- `src/lib/orders.ts` — order state machine (`PENDING_PAYMENT → PAID →
  FULFILLED → SHIPPED → DELIVERED`, with `CANCELLED`/`REFUNDED` terminals and
  automatic restock). Invalid transitions are rejected.
- `src/lib/auth.ts` — scrypt password hashing, opaque session tokens stored as
  SHA-256 hashes, httpOnly SameSite=Lax cookies.
- `src/app/api/**` — REST endpoints with zod validation, rate limiting on
  auth/checkout/coupon endpoints, and ownership checks on every mutation.
- `src/app/admin/**` — admin dashboard (orders, products, categories, coupons,
  reviews, customers, settings), gated by role check in the layout **and** in
  every admin API route.

## Going to production (GitHub → Vercel → Supabase)

### 1. Deploy the database (Supabase)

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. Go to **Settings → Database** and copy the **Connection string** (use the
   `postgresql://` format with `?schema=public`).
3. Keep this string for the Vercel environment variables.

### 2. Deploy the app (Vercel)

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Add the following environment variables in the Vercel dashboard:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_PROVIDER` | `postgresql` | yes |
| `DATABASE_URL` | Supabase connection string | yes |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel domain (e.g. `https://acritmaison.vercel.app`) | yes |
| `ADMIN_EMAIL` | Admin email for the seed | yes |
| `ADMIN_PASSWORD` | Admin password (change after first seed) | yes |
| `STRIPE_SECRET_KEY` | Stripe API key | no |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | no |
| `RESEND_API_KEY` | Resend API key | no |
| `RESEND_EMAIL_FROM` | From address for emails | no |

4. Deploy. Vercel runs `npm run build` which executes `prisma generate` and
   `next build`. The build connects to Supabase via `DATABASE_URL`.

### 3. Initialize the database

After the first Vercel deployment, run these commands locally against the
Supabase database (or use the Supabase SQL editor):

```bash
# Point DATABASE_URL at your Supabase project, then:
npx prisma db push
npm run db:seed
```

Alternatively, add a Vercel **Deployment Command** or use a post-deploy
script to run `prisma db push` and `prisma db seed` automatically.

### 4. Stripe (optional)

Point a Stripe webhook at `https://your-domain/api/webhooks/stripe`.
Supported events: `checkout.session.completed`, `charge.refunded`.

### 5. Email (optional)

When `RESEND_API_KEY` is set, transactional emails are sent for real.
Without it, they are written to the server log.

### Local development

```bash
npm install
npx prisma db push        # creates SQLite database
npm run db:seed           # seed catalog, settings, admin account
npm run dev               # http://localhost:3000
```

To test PostgreSQL locally, set `DATABASE_PROVIDER=postgresql` and
`DATABASE_URL` to a local PostgreSQL connection string.

### Scaling note

The in-memory rate limiter in `src/lib/rate-limit.ts` works for a single-node
deployment (Vercel free tier is single-node). For horizontal scaling, replace
it with a Redis-backed limiter.
