CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`altText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`postId` int,
	`category` enum('upcoming','published','failed','account') NOT NULL,
	`title` varchar(191) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`socialAccountId` int NOT NULL,
	`platform` enum('x','instagram','linkedin','facebook') NOT NULL,
	`status` enum('queued','publishing','published','failed') NOT NULL DEFAULT 'queued',
	`externalPostId` varchar(191),
	`publishUrl` text,
	`characterCount` int NOT NULL DEFAULT 0,
	`lastError` text,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `postChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_channels_unique` UNIQUE(`postId`,`socialAccountId`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`body` text NOT NULL,
	`status` enum('draft','scheduled','publishing','published','failed') NOT NULL DEFAULT 'draft',
	`selectedTimezone` varchar(64),
	`scheduledLocalTime` varchar(32),
	`scheduledFor` timestamp,
	`scheduleCronTaskUid` varchar(65),
	`publishedAt` timestamp,
	`failedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_cron_task_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE TABLE `publishingAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`postChannelId` int,
	`userId` int NOT NULL,
	`platform` varchar(32) NOT NULL,
	`outcome` enum('success','failure','skipped') NOT NULL,
	`providerStatusCode` int,
	`errorMessage` text,
	`externalPostId` varchar(191),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publishingAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('x','instagram','linkedin','facebook') NOT NULL,
	`platformAccountId` varchar(191) NOT NULL,
	`handle` varchar(191) NOT NULL,
	`displayName` varchar(191),
	`avatarUrl` text,
	`connectionStatus` enum('pending','connected','expired','error') NOT NULL DEFAULT 'pending',
	`encryptedAccessToken` text,
	`encryptedRefreshToken` text,
	`tokenExpiresAt` timestamp,
	`grantedScopes` text,
	`connectionMetadata` text,
	`lastError` text,
	`connectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_accounts_identity_unique` UNIQUE(`userId`,`platform`,`platformAccountId`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultTimezone` varchar(64) NOT NULL DEFAULT 'America/New_York',
	`upcomingAlertsEnabled` int NOT NULL DEFAULT 1,
	`publishAlertsEnabled` int NOT NULL DEFAULT 1,
	`failureAlertsEnabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`membershipRole` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'owner',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_membership_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`planTier` enum('free','starter','pro','business') NOT NULL DEFAULT 'free',
	`subscriptionStatus` enum('trial','active','past_due','cancelled') NOT NULL DEFAULT 'trial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `media_assets_user_idx` ON `mediaAssets` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `post_channels_post_idx` ON `postChannels` (`postId`);--> statement-breakpoint
CREATE INDEX `posts_user_status_idx` ON `posts` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `posts_scheduled_for_idx` ON `posts` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `publishing_attempts_post_idx` ON `publishingAttempts` (`postId`);--> statement-breakpoint
CREATE INDEX `social_accounts_user_idx` ON `socialAccounts` (`userId`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspaceMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `workspaces_owner_idx` ON `workspaces` (`ownerUserId`);