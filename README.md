# Exclusive Hatz

Next.js storefront prepared for **Vercel**, with Stripe Checkout and a protected admin dashboard. This repository does not use Shopify or require Cloudflare Workers/Sites.

## Deploy to Vercel

1. Import `princeoffnepal-sketch/hatz` in Vercel. Root directory: repository root. Framework: **Next.js**. Node: **22.x**. Install: `npm ci`. Build: use the `vercel.json` command. Leave Output Directory at the framework default.
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
| `ADMIN_PASSWORD_HASH` | Generated with `npm run admin:password`; changing it invalidates existing admin sessions |
| `RATE_LIMIT_SECRET` | Random server-only secret used to pseudonymize client addresses for rate limits |
| `STRIPE_SECRET_KEY` | Stripe server-side test/live key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe/webhook` |
| `STRIPE_AUTOMATIC_TAX` | `false` until merchant tax settings are ready |
| `CONTACT_FORM_ENDPOINT` | Optional forwarding endpoints; otherwise use the database inbox |

Never put credentials in `NEXT_PUBLIC_` variables. Vercel environment changes require a new deployment. No database credentials means browsing/cart still work; persistent admin, analytics and inbox features require database setup. Local files must not be used as production storage on Vercel.

## Store behavior

- Nine snapbacks, 35 original owner-supplied photos, **$65 each**.
- U.S. only. **$7.50 shipping for one hat; free for 2+ payable hats**, including mixed designs.
- Merchant-confirmed estimated delivery: **3–5 business days from purchase to doorstep, including production**. Exact dispatch dates and calendar arrival dates are not invented.
- Operated by **Mogfit**. Customer card statements show MOGFIT; this is disclosed at checkout. Support: `exclusivehatzz@gmail.com`.
- Cancellation before shipment. Eligible unused/unworn/undamaged returns requested within 14 days; customer pays return postage. Damaged arrivals are replaced after return, with customer-paid return postage, subject to applicable rights. Return instructions are supplied by support.
- Protected admin at `/admin`: sales, shopping activity, orders, submissions and **$7 per paid hat** commission. Two hats earn $14. Refunds and disputes adjust/hold commission. Owner-payment records track manual settlements; they do not transfer money. Automatic revenue splitting is not configured.

## Payments and manual operations

Production uses Stripe-hosted Checkout with live credentials stored as sensitive Vercel variables, never in Git. The $65 catalog prices and $7.50/free-at-two shipping rules are calculated on the server. The webhook handles paid orders, refunds and disputes; checkout return verification is an idempotent backup for delayed webhooks. Only paid sessions marked `store=exclusive-hatz` from the matching live/test mode produce order confirmations.

The merchant opted to launch with manual fulfillment and without a completed real purchase/delivery test. `config/launch.ts` records that policy; it does not claim an order was tested or delivered. Real photos and published descriptions are required; unmeasured specifications remain unpublished. Supplier automation and a fulfilled test order remain visible operational checks in the protected launch page. Core payment, delivery, catalog, policy and business-contact checks still gate checkout.

**Every order needs manual action.** Admin users can open each order's items, customer contact and shipping address, submit it to the fulfillment partner, and record production status and carrier/tracking details. The customer confirmation link displays recorded tracking. Email notifications and supplier forwarding are not connected. Check admin regularly and send customer updates manually.

The website partner collects the full payment, retains **$7 per eligible paid hat**, handles refunds/disputes, and pays the owner separately. The admin can record actual payments to the owner, but never initiates transfers. No owner payout balance is calculated because fee, shipping, tax and other cost allocations have not been agreed. Historical partner-payment records are preserved in the original table; new owner transfers use `owner_payments`.

Register these snapshot webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`. The endpoint is `/api/stripe/webhook`; its API version matches the installed Stripe SDK. Update sensitive `STRIPE_SECRET_KEY` and redeploy when rotating the API key. Keep the existing webhook secret unless rotating that endpoint's signing secret too.

Stripe Tax is controlled by `STRIPE_AUTOMATIC_TAX`; enable only after configuring the merchant's tax settings and applicable registrations. No real charge, refund, supplier submission or bank transfer is performed by deployment. Public catalog pages are indexable and included in `/sitemap.xml`; admin, checkout, order, cart and search pages are excluded. Preview deployments remain blocked in robots.txt.

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

## Public-launch security and operating limits

- Per-request nonce CSP, anti-framing headers, no-referrer policy, HTTPS-only cookies, no caching/indexing of private order/admin pages, and small bounded request bodies.
- Vercel edge IP-based limits for login, checkout, order lookup, analytics and forms. Raw IPs are not stored; keyed hashes change daily. Do not run behind an untrusted proxy or reuse these IP assumptions on another host without adapting them.
- Checkout prices remain server-owned. Identical open checkouts are reused with Stripe idempotency keys; paid/expired attempts get a new key. This prevents accidental session creation on ordinary retries; it is not a guarantee against a shopper deliberately purchasing twice.
- Hatz checkout allows compatible cards and Link (including eligible card wallets), rather than delayed bank-debit methods. The paid webhook remains the authority for fulfillment. Automatic tax uses the Hats category, not the Mogfit app default.
- Signed webhooks have durable event deduplication with retry leases. Refunds arriving before checkout are retained only after verifying Hatz payment metadata. Test/live and other-store events do not become Hatz orders.
- The shared admin credential grants full access. Give it only to the authorized operator and owner. For a larger staff, add separate accounts with MFA and individual audit identities before expanding access. Never publish the private access file.
- Rotate any Stripe API key exposed in chat using Stripe Dashboard, replace `STRIPE_SECRET_KEY` in Vercel Production and redeploy; revoke the old key after verifying the replacement. Code changes cannot revoke an exposed key. Keep the existing webhook signing secret unless rotating it separately.
- Manual fulfillment, customer shipping updates, return instructions and owner settlements remain operational responsibilities. Do not promise an automatic supplier integration or outbound email service until a provider is connected. Complete a real paid/refund/fulfillment rehearsal before a large promotion; automated tests do not prove delivery.
- No load capacity is claimed. Monitor Vercel/Stripe errors and Turso usage during traffic growth; provider plan quotas and denial-of-service protection remain outside application unit tests.

New-design email signup is disabled. The public form and signup server action are removed; existing subscriber records remain available to authorized administrators. Contact support continues to work.
