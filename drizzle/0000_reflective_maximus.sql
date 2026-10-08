CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_courses_owner` ON `courses` (`owner`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`email` text NOT NULL,
	`learner_id` text,
	`data` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_enrollment_course_email` ON `enrollments` (`owner`,`course_id`,`email`);--> statement-breakpoint
CREATE INDEX `idx_enrollment_owner` ON `enrollments` (`owner`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_orders_owner` ON `orders` (`owner`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`enrollment_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	PRIMARY KEY(`enrollment_id`, `lesson_id`),
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`settings` text NOT NULL
);
