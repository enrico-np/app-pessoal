CREATE TABLE `home_groups` (
	`group_key` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `home_groups_position_unique` ON `home_groups` (`position`);--> statement-breakpoint
CREATE TABLE `home_panels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type_key` text NOT NULL,
	`group_key` text NOT NULL,
	`size` text NOT NULL,
	`position` integer NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `home_panels_group_position_unique` ON `home_panels` (`group_key`,`position`);--> statement-breakpoint
CREATE TABLE `home_pins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`icon` text NOT NULL,
	`href` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `home_pins_position_unique` ON `home_pins` (`position`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`feature_key` text NOT NULL,
	`action` text NOT NULL,
	`summary` text NOT NULL,
	`target_href` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_log_created_at_idx` ON `activity_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_log_kind_idx` ON `activity_log` (`kind`);