CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`event` text NOT NULL,
	`path` text NOT NULL,
	`item` text,
	`created` integer NOT NULL,
	`mode` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_date` ON `events` (`created`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_intent` text NOT NULL,
	`created` integer NOT NULL,
	`live` integer NOT NULL,
	`currency` text NOT NULL,
	`subtotal` integer NOT NULL,
	`total` integer NOT NULL,
	`quantity` integer NOT NULL,
	`items` text NOT NULL,
	`commission_rate` integer NOT NULL,
	`fulfillment` text DEFAULT 'awaiting_supplier' NOT NULL,
	`refunded_units` integer,
	`reviewed_refund` integer
);
--> statement-breakpoint
CREATE INDEX `orders_pi` ON `orders` (`payment_intent`);--> statement-breakpoint
CREATE INDEX `orders_date` ON `orders` (`created`);--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`reference` text NOT NULL,
	`created` integer NOT NULL,
	`live` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payouts_reference_unique` ON `payouts` (`reference`);--> statement-breakpoint
CREATE TABLE `refunds` (
	`payment_intent` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL,
	`version` text NOT NULL
);
