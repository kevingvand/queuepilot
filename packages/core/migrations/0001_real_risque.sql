ALTER TABLE `items` ADD `mention_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `last_touched_at` integer;--> statement-breakpoint
ALTER TABLE `cycles` ADD `goal` text;