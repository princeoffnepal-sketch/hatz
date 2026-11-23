CREATE TABLE stripe_events (
 id text PRIMARY KEY NOT NULL,
 processed integer NOT NULL DEFAULT 0,
 lease_until integer NOT NULL,
 updated integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX rate_limits_expiry ON rate_limits(expires);
--> statement-breakpoint
CREATE INDEX sessions_expiry ON admin_sessions(expires);
--> statement-breakpoint
CREATE INDEX submissions_kind_email ON submissions(kind,email);
--> statement-breakpoint
CREATE INDEX stripe_events_updated ON stripe_events(updated);
