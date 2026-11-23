import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
 id:text('id').primaryKey(), paymentIntent:text('payment_intent').notNull(), created:integer('created').notNull(), live:integer('live').notNull(), currency:text('currency').notNull(),
 subtotal:integer('subtotal').notNull(), total:integer('total').notNull(), quantity:integer('quantity').notNull(), items:text('items').notNull(), commissionRate:integer('commission_rate').notNull(),
 fulfillment:text('fulfillment').notNull().default('awaiting_supplier'), refundedUnits:integer('refunded_units'), reviewedRefund:integer('reviewed_refund'),
 customerName:text('customer_name'), customerEmail:text('customer_email'), shippingAddress:text('shipping_address'), trackingNumber:text('tracking_number'), carrier:text('carrier'), trackingUrl:text('tracking_url'),
}, t=>[index('orders_pi').on(t.paymentIntent),index('orders_date').on(t.created)]);
export const refunds=sqliteTable('refunds',{ paymentIntent:text('payment_intent').primaryKey(), amount:integer('amount').notNull(), updated:integer('updated').notNull() });
export const sessions=sqliteTable('admin_sessions',{ tokenHash:text('token_hash').primaryKey(), expires:integer('expires').notNull(), version:text('version').notNull() });
export const attempts=sqliteTable('rate_limits',{ id:text('id').primaryKey(), count:integer('count').notNull(), expires:integer('expires').notNull() });
export const events=sqliteTable('events',{ id:text('id').primaryKey(), session:text('session').notNull(), event:text('event').notNull(), path:text('path').notNull(), item:text('item'), created:integer('created').notNull(), mode:text('mode').notNull() },t=>[index('events_date').on(t.created)]);
export const payouts=sqliteTable('payouts',{ id:text('id').primaryKey(), amount:integer('amount').notNull(), reference:text('reference').notNull().unique(), created:integer('created').notNull(), live:integer('live').notNull() });
export const ownerPayments=sqliteTable('owner_payments',{ id:text('id').primaryKey(), amount:integer('amount').notNull(), reference:text('reference').notNull().unique(), created:integer('created').notNull(), live:integer('live').notNull() });
export const audit=sqliteTable('admin_audit',{id:text('id').primaryKey(), action:text('action').notNull(), detail:text('detail').notNull(), created:integer('created').notNull()});

export const submissions=sqliteTable('submissions',{id:text('id').primaryKey(),kind:text('kind').notNull(),name:text('name'),email:text('email').notNull(),topic:text('topic'),message:text('message'),created:integer('created').notNull()});

export const disputes=sqliteTable('disputes',{paymentIntent:text('payment_intent').primaryKey(),status:text('status').notNull(),updated:integer('updated').notNull()});

export const stripeEvents=sqliteTable('stripe_events',{id:text('id').primaryKey(),processed:integer('processed').notNull().default(0),leaseUntil:integer('lease_until').notNull(),updated:integer('updated').notNull()},t=>[index('stripe_events_updated').on(t.updated)]);
