CREATE TABLE `disputes` (
	`payment_intent` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`updated` integer NOT NULL
);
