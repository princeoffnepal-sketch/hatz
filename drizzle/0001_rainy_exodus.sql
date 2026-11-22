CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`topic` text,
	`message` text,
	`created` integer NOT NULL
);
