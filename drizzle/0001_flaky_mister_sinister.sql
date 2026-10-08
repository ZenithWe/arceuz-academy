CREATE TABLE `storefront` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO storefront (id, owner) SELECT 'primary', owner FROM workspaces LIMIT 1;
