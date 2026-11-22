# Exclusive Hatz

Next.js storefront prepared for **Vercel**, with Stripe Checkout and a protected admin dashboard. This repository does not use Shopify or require Cloudflare Workers/Sites.

## Deploy to Vercel

1. Import `princeoffnepal-sketch/hatz` in Vercel. Root directory: repository root. Framework: **Next.js**. Node: **22.x**. Install: `npm ci`. Build: `npm run build`. Leave Output Directory at the framework default.
2. Add the environment variables below. Start with `STORE_MODE=demo`; the catalog/cart work, but payment remains disabled.
3. Create a **Turso libSQL database** and connect its URL and auth token to Vercel's Production environment. The Vercel build applies checked, repeatable migrations before building when the production database is configured; a migration failure stops the deployment. This works with sensitive variables without downloading their values. Preview builds do not run migrations; use a separate database for preview/test deployments. For a separately configured local database, run `npm run db:migrate`.
4. Run `npm run admin:password`. Enter the admin password at the hidden prompt and copy the resulting hash into Vercel's `ADMIN_PASSWORD_HASH`. No plaintext password or password hash is committed. `/admin` needs this hash and the initialized database.
5. Deploy. Set `NEXT_PUBLIC_SITE_URL` to your actual HTTPS Vercel/custom domain and redeploy before enabling checkout.

| Variable | Purpose |
| --- | --- |
| `STORE_MODE` | `demo` initially; `stripe-test` for payment validation; `live` only after launch checks pass |
| `NEXT_PUBLIC_SITE_URL` | Public HTTPS origin; used for canonical URLs and Stripe redirects |
| `TURSO_DATABASE_URL` | Persistent remote libSQL database URL |
| `TURSO_AUTH_TOKEN` | Server-only database credential |
| `ADMIN_PASSWORD_HASH` | Generated with `npm run admin:password` |
| `STRIPE_SECRET_KEY` | Stripe server-side test/live key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe/webhook` |
| `STRIPE_AUTOMATIC_TAX` | `false` until merchant tax settings are ready |
| `CONTACT_FORM_ENDPOINT`, `NEWSLETTER_ENDPOINT` | Optional forwarding endpoints; otherwise use the database inbox |

Never put credentials in `NEXT_PUBLIC_` variables. Vercel environment changes require a new deployment. No database credentials means browsing/cart still work; persistent admin, analytics and inbox features require database setup. Local files must not be used as production storage on Vercel.

## Store behavior

- Nine snapbacks, 35 original owner-supplied photos, **$65 each**.
- U.S. only. **$7.50 shipping for one hat; free for 2+ payable hats**, including mixed designs.
- Estimated transit: **3 business days after dispatch**. Production time is separate and remains unconfirmed.
- Support: `exclusivehatzz@gmail.com`.
- Cancellation before shipment. Eligible unused/unworn/undamaged returns requested within 14 days; customer pays return postage. Damaged arrivals are replaced after return, with customer-paid return postage, subject to applicable rights. Return instructions are supplied by support.
- Protected admin at `/admin`: sales, shopping activity, orders, submissions and **$7 per paid hat** commission. Two hats earn $14. Refunds and disputes adjust/hold commission. Recording a payout records money received; it does not transfer money. Automatic revenue splitting is not configured.

## Before accepting real payments

The code is deployable; the store is **not yet ready to collect live payments**. Remaining setup includes Stripe, supplier SKU mapping and fulfillment, production timing, fit/material verification, business identity, final privacy/terms, return destination, customer email/tracking and an end-to-end order/refund check. The launch gate is in `lib/checkout/gate.ts` and `/launch-readiness` (admin-only). Do not bypass it to force payment on.

Register these Stripe webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`. Orders are idempotent by checkout session ID. Unsubmitted supplier orders remain `awaiting_supplier`; no supplier automation is connected yet.

The public preview remains noindex in `app/layout.tsx` and `app/robots.ts`. Enable indexing only after launch setup is complete.

## Local development

```sh
npm ci
cp .env.example .env.local
# For local database testing: set TURSO_DATABASE_URL=file:./local.db
npm run db:migrate
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
```

Main edit locations: `data/catalog.ts`, `config/site.ts`, `config/delivery.ts`, `config/policies.ts`, `data/private/supplier.server.ts`. Migrations in `drizzle/` are schema-only and tracked by checksum; `npm run db:migrate` is repeatable. Never edit an applied migration.

The original Sites deployment and database are separate. This GitHub repository contains source and schema only: **no existing orders, admin sessions, contacts, analytics rows, secrets or database contents are migrated**. Keep or securely export any old operational data before deleting the old hosting project.

Official deployment references: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel environment variables](https://vercel.com/docs/environment-variables), [Turso libSQL TypeScript client](https://docs.turso.tech/sdk/ts/reference).
