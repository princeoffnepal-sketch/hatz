ALTER TABLE orders ADD COLUMN customer_name text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN customer_email text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN shipping_address text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN tracking_number text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN carrier text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN tracking_url text;
--> statement-breakpoint
CREATE TABLE owner_payments (
  id text PRIMARY KEY NOT NULL,
  amount integer NOT NULL,
  reference text NOT NULL UNIQUE,
  created integer NOT NULL,
  live integer NOT NULL
);
