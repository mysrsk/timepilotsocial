CREATE TABLE `nativeOAuthAuthorizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`socialAccountId` int NOT NULL,
	`platform` enum('x','instagram','linkedin','facebook') NOT NULL,
	`state` varchar(191) NOT NULL,
	`encryptedCodeVerifier` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nativeOAuthAuthorizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `native_oauth_state_unique` UNIQUE(`state`)
);
--> statement-breakpoint
CREATE INDEX `native_oauth_user_idx` ON `nativeOAuthAuthorizations` (`userId`);