CREATE TABLE `postMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`mediaAssetId` int NOT NULL,
	`userId` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postMedia_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_media_unique` UNIQUE(`postId`,`mediaAssetId`)
);
--> statement-breakpoint
CREATE INDEX `post_media_post_idx` ON `postMedia` (`postId`);--> statement-breakpoint
CREATE INDEX `post_media_user_idx` ON `postMedia` (`userId`);