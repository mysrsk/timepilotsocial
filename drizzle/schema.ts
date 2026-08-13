import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerUserId: int("ownerUserId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    planTier: mysqlEnum("planTier", ["free", "starter", "pro", "business"])
      .default("free")
      .notNull(),
    subscriptionStatus: mysqlEnum("subscriptionStatus", [
      "trial",
      "active",
      "past_due",
      "cancelled",
    ])
      .default("trial")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("workspaces_owner_idx").on(table.ownerUserId)]
);

export const workspaceMembers = mysqlTable(
  "workspaceMembers",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull(),
    userId: int("userId").notNull(),
    membershipRole: mysqlEnum("membershipRole", ["owner", "admin", "editor", "viewer"])
      .default("owner")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_membership_unique").on(table.workspaceId, table.userId),
    index("workspace_members_user_idx").on(table.userId),
  ]
);

export const userPreferences = mysqlTable(
  "userPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    defaultTimezone: varchar("defaultTimezone", { length: 64 })
      .default("America/New_York")
      .notNull(),
    upcomingAlertsEnabled: int("upcomingAlertsEnabled").default(1).notNull(),
    publishAlertsEnabled: int("publishAlertsEnabled").default(1).notNull(),
    failureAlertsEnabled: int("failureAlertsEnabled").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("user_preferences_user_unique").on(table.userId)]
);

export const socialAccounts = mysqlTable(
  "socialAccounts",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull(),
    userId: int("userId").notNull(),
    platform: mysqlEnum("platform", ["x", "instagram", "linkedin", "facebook"]).notNull(),
    platformAccountId: varchar("platformAccountId", { length: 191 }).notNull(),
    handle: varchar("handle", { length: 191 }).notNull(),
    displayName: varchar("displayName", { length: 191 }),
    avatarUrl: text("avatarUrl"),
    connectionStatus: mysqlEnum("connectionStatus", [
      "pending",
      "connected",
      "expired",
      "error",
    ])
      .default("pending")
      .notNull(),
    encryptedAccessToken: text("encryptedAccessToken"),
    encryptedRefreshToken: text("encryptedRefreshToken"),
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    grantedScopes: text("grantedScopes"),
    connectionMetadata: text("connectionMetadata"),
    lastError: text("lastError"),
    connectedAt: timestamp("connectedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("social_accounts_identity_unique").on(
      table.userId,
      table.platform,
      table.platformAccountId
    ),
    index("social_accounts_user_idx").on(table.userId),
  ]
);

export const mediaAssets = mysqlTable(
  "mediaAssets",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull(),
    userId: int("userId").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    altText: text("altText"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("media_assets_user_idx").on(table.userId)]
);

export const posts = mysqlTable(
  "posts",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull(),
    userId: int("userId").notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["draft", "scheduled", "publishing", "published", "failed"])
      .default("draft")
      .notNull(),
    selectedTimezone: varchar("selectedTimezone", { length: 64 }),
    scheduledLocalTime: varchar("scheduledLocalTime", { length: 32 }),
    scheduledFor: timestamp("scheduledFor"),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    publishedAt: timestamp("publishedAt"),
    failedAt: timestamp("failedAt"),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("posts_user_status_idx").on(table.userId, table.status),
    index("posts_scheduled_for_idx").on(table.scheduledFor),
    uniqueIndex("posts_cron_task_unique").on(table.scheduleCronTaskUid),
  ]
);

export const postChannels = mysqlTable(
  "postChannels",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    workspaceId: int("workspaceId").notNull(),
    userId: int("userId").notNull(),
    socialAccountId: int("socialAccountId").notNull(),
    platform: mysqlEnum("platform", ["x", "instagram", "linkedin", "facebook"]).notNull(),
    status: mysqlEnum("status", ["queued", "publishing", "published", "failed"])
      .default("queued")
      .notNull(),
    externalPostId: varchar("externalPostId", { length: 191 }),
    publishUrl: text("publishUrl"),
    characterCount: int("characterCount").default(0).notNull(),
    lastError: text("lastError"),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("post_channels_unique").on(table.postId, table.socialAccountId),
    index("post_channels_post_idx").on(table.postId),
  ]
);

export const postMedia = mysqlTable(
  "postMedia",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    mediaAssetId: int("mediaAssetId").notNull(),
    userId: int("userId").notNull(),
    position: int("position").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("post_media_unique").on(table.postId, table.mediaAssetId),
    index("post_media_post_idx").on(table.postId),
    index("post_media_user_idx").on(table.userId),
  ]
);

export const publishingAttempts = mysqlTable(
  "publishingAttempts",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    postChannelId: int("postChannelId"),
    userId: int("userId").notNull(),
    platform: varchar("platform", { length: 32 }).notNull(),
    outcome: mysqlEnum("outcome", ["success", "failure", "skipped"]).notNull(),
    providerStatusCode: int("providerStatusCode"),
    errorMessage: text("errorMessage"),
    externalPostId: varchar("externalPostId", { length: 191 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("publishing_attempts_post_idx").on(table.postId)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull(),
    userId: int("userId").notNull(),
    postId: int("postId"),
    category: mysqlEnum("category", ["upcoming", "published", "failed", "account"])
      .notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    body: text("body").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_user_created_idx").on(table.userId, table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SocialPlatform = (typeof socialAccounts.$inferSelect)["platform"];
