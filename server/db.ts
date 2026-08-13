import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  mediaAssets,
  nativeOAuthAuthorizations,
  notifications,
  postChannels,
  postMedia,
  posts,
  publishingAttempts,
  socialAccounts,
  type SocialPlatform,
  userPreferences,
  users,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db;
}

export async function ensureWorkspaceForUser(userId: number, name?: string) {
  const db = await requireDb();
  const existing = (await db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId)).limit(1))[0];
  if (existing) return existing;
  await db.insert(workspaces).values({
    ownerUserId: userId,
    name: `${name?.trim() || "My"} workspace`,
  });
  const created = (await db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId)).limit(1))[0];
  if (!created) throw new Error("Unable to create workspace.");
  await db.insert(workspaceMembers).values({ workspaceId: created.id, userId, membershipRole: "owner" });
  await db.insert(userPreferences).values({ userId });
  return created;
}

export async function getDashboardSnapshot(userId: number, name?: string) {
  const db = await requireDb();
  const workspace = await ensureWorkspaceForUser(userId, name);
  const [accounts, userPosts, alerts, channels] = await Promise.all([
    db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId)),
    db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(6),
    db.select().from(postChannels).where(eq(postChannels.userId, userId)),
  ]);
  const statusCounts = userPosts.reduce<Record<string, number>>((counts, post) => {
    counts[post.status] = (counts[post.status] ?? 0) + 1;
    return counts;
  }, {});
  const platformSummary = (["x", "instagram", "linkedin", "facebook"] as const).map(platform => {
    const platformChannels = channels.filter(channel => channel.platform === platform);
    return {
      platform,
      published: platformChannels.filter(channel => channel.status === "published").length,
      queued: platformChannels.filter(channel => channel.status === "queued").length,
      failed: platformChannels.filter(channel => channel.status === "failed").length,
      engagement: "—",
    };
  });
  return {
    workspace,
    accounts,
    posts: userPosts,
    notifications: alerts,
    analytics: {
      published: statusCounts.published ?? 0,
      scheduled: statusCounts.scheduled ?? 0,
      failed: statusCounts.failed ?? 0,
      drafts: statusCounts.draft ?? 0,
      engagement: "—",
      byPlatform: platformSummary,
    },
  };
}

export async function listSocialAccounts(userId: number) {
  const db = await requireDb();
  return db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
}

export async function attachSocialHandle(input: {
  userId: number;
  workspaceId: number;
  platform: SocialPlatform;
  handle: string;
  displayName?: string;
}) {
  const db = await requireDb();
  const normalizedHandle = input.handle.trim().replace(/^@/, "");
  await db.insert(socialAccounts).values({
    userId: input.userId,
    workspaceId: input.workspaceId,
    platform: input.platform,
    platformAccountId: `pending:${input.platform}:${normalizedHandle.toLowerCase()}`,
    handle: `@${normalizedHandle}`,
    displayName: input.displayName?.trim() || null,
    connectionStatus: "pending",
  });
  return (
    await db
      .select()
      .from(socialAccounts)
      .where(and(eq(socialAccounts.userId, input.userId), eq(socialAccounts.handle, `@${normalizedHandle}`)))
      .limit(1)
  )[0];
}

export async function detachSocialAccount(userId: number, accountId: number) {
  const db = await requireDb();
  await db.delete(socialAccounts).where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId)));
}

export async function getSocialAccountForUser(userId: number, accountId: number) {
  const db = await requireDb();
  return (await db.select().from(socialAccounts).where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId))).limit(1))[0];
}

export async function createNativeAuthorization(input: {
  workspaceId: number;
  userId: number;
  socialAccountId: number;
  platform: SocialPlatform;
  state: string;
  encryptedCodeVerifier: string;
}) {
  const db = await requireDb();
  await db.insert(nativeOAuthAuthorizations).values({ ...input, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
}

export async function consumeNativeAuthorization(state: string) {
  const db = await requireDb();
  const authorization = (await db.select().from(nativeOAuthAuthorizations).where(and(eq(nativeOAuthAuthorizations.state, state), isNull(nativeOAuthAuthorizations.consumedAt), gt(nativeOAuthAuthorizations.expiresAt, new Date()))).limit(1))[0];
  if (!authorization) return undefined;
  const result = await db.update(nativeOAuthAuthorizations).set({ consumedAt: new Date() }).where(and(eq(nativeOAuthAuthorizations.id, authorization.id), isNull(nativeOAuthAuthorizations.consumedAt)));
  const payload = Array.isArray(result) ? result[0] : result;
  return (payload as { affectedRows?: number } | undefined)?.affectedRows ? authorization : undefined;
}

export async function completeNativeAuthorization(input: {
  authorization: { userId: number; socialAccountId: number };
  encryptedAccessToken: string;
  encryptedRefreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  grantedScopes?: string | null;
  connectionMetadata?: string | null;
}) {
  const db = await requireDb();
  await db.update(socialAccounts).set({ connectionStatus: "connected", encryptedAccessToken: input.encryptedAccessToken, encryptedRefreshToken: input.encryptedRefreshToken ?? null, tokenExpiresAt: input.tokenExpiresAt ?? null, grantedScopes: input.grantedScopes ?? null, connectionMetadata: input.connectionMetadata ?? null, connectedAt: new Date(), lastError: null }).where(and(eq(socialAccounts.id, input.authorization.socialAccountId), eq(socialAccounts.userId, input.authorization.userId)));
}

export async function updateNativeTokenSet(input: { userId: number; socialAccountId: number; encryptedAccessToken: string; encryptedRefreshToken?: string | null; tokenExpiresAt?: Date | null }) {
  const db = await requireDb();
  await db.update(socialAccounts).set({ encryptedAccessToken: input.encryptedAccessToken, encryptedRefreshToken: input.encryptedRefreshToken ?? null, tokenExpiresAt: input.tokenExpiresAt ?? null, connectionStatus: "connected", lastError: null }).where(and(eq(socialAccounts.id, input.socialAccountId), eq(socialAccounts.userId, input.userId)));
}

export async function createMediaAsset(input: {
  userId: number;
  workspaceId: number;
  base64: string;
  fileName: string;
  mimeType: string;
}) {
  const db = await requireDb();
  const buffer = Buffer.from(input.base64, "base64");
  const { key, url } = await storagePut(`social-media/${input.userId}/${input.fileName}`, buffer, input.mimeType);
  await db.insert(mediaAssets).values({
    userId: input.userId,
    workspaceId: input.workspaceId,
    storageKey: key,
    storageUrl: url,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: buffer.byteLength,
  });
  return (
    await db.select().from(mediaAssets).where(and(eq(mediaAssets.userId, input.userId), eq(mediaAssets.storageKey, key))).limit(1)
  )[0];
}

async function attachMediaToPost(userId: number, postId: number, mediaAssetIds: number[]) {
  if (!mediaAssetIds.length) return;
  const db = await requireDb();
  const ownedAssets = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.userId, userId), inArray(mediaAssets.id, mediaAssetIds)));
  if (ownedAssets.length !== mediaAssetIds.length) throw new Error("One or more media items are unavailable.");
  await db.insert(postMedia).values(
    mediaAssetIds.map((mediaAssetId, position) => ({ postId, mediaAssetId, userId, position }))
  );
}

export async function createDraft(input: { userId: number; workspaceId: number; body: string; mediaAssetIds: number[] }) {
  const db = await requireDb();
  await db.insert(posts).values({ userId: input.userId, workspaceId: input.workspaceId, body: input.body, status: "draft" });
  const post = (
    await db.select().from(posts).where(eq(posts.userId, input.userId)).orderBy(desc(posts.id)).limit(1)
  )[0];
  if (!post) throw new Error("Unable to save draft.");
  await attachMediaToPost(input.userId, post.id, input.mediaAssetIds);
  return post;
}

export async function createScheduledPost(input: {
  userId: number;
  workspaceId: number;
  body: string;
  timezone: string;
  localTime: string;
  scheduledFor: Date;
  accountIds: number[];
  mediaAssetIds: number[];
}) {
  const db = await requireDb();
  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.userId, input.userId), inArray(socialAccounts.id, input.accountIds)));
  if (accounts.length !== input.accountIds.length || accounts.some(account => account.connectionStatus !== "connected")) {
    throw new Error("Every scheduled destination must be a connected native social account.");
  }
  await db.insert(posts).values({
    userId: input.userId,
    workspaceId: input.workspaceId,
    body: input.body,
    status: "scheduled",
    selectedTimezone: input.timezone,
    scheduledLocalTime: input.localTime,
    scheduledFor: input.scheduledFor,
  });
  const post = (await db.select().from(posts).where(eq(posts.userId, input.userId)).orderBy(desc(posts.id)).limit(1))[0];
  if (!post) throw new Error("Unable to create scheduled post.");
  await attachMediaToPost(input.userId, post.id, input.mediaAssetIds);
  await db.insert(postChannels).values(
    accounts.map(account => ({
      postId: post.id,
      workspaceId: input.workspaceId,
      userId: input.userId,
      socialAccountId: account.id,
      platform: account.platform,
      characterCount: input.body.length,
    }))
  );
  return post;
}

export async function setPostScheduleTask(userId: number, postId: number, taskUid: string) {
  const db = await requireDb();
  await db
    .update(posts)
    .set({ scheduleCronTaskUid: taskUid })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)));
}

export async function updateScheduledPost(input: {
  userId: number;
  postId: number;
  timezone: string;
  localTime: string;
  scheduledFor: Date;
}) {
  const db = await requireDb();
  await db
    .update(posts)
    .set({ selectedTimezone: input.timezone, scheduledLocalTime: input.localTime, scheduledFor: input.scheduledFor, status: "scheduled" })
    .where(and(eq(posts.id, input.postId), eq(posts.userId, input.userId)));
  return (await db.select().from(posts).where(and(eq(posts.id, input.postId), eq(posts.userId, input.userId))).limit(1))[0];
}

export async function updatePostBodyForUser(userId: number, postId: number, body: string) {
  const db = await requireDb();
  await db
    .update(posts)
    .set({ body })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId), inArray(posts.status, ["draft", "scheduled"])));
  return (
    await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
      .limit(1)
  )[0];
}

export async function getPostForUser(userId: number, postId: number) {
  const db = await requireDb();
  return (await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.userId, userId))).limit(1))[0];
}

export async function deletePostForUser(userId: number, postId: number) {
  const db = await requireDb();
  await db.delete(postChannels).where(and(eq(postChannels.postId, postId), eq(postChannels.userId, userId)));
  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.userId, userId)));
}

export async function listNotifications(userId: number) {
  const db = await requireDb();
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await requireDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function createNotification(input: {
  workspaceId: number;
  userId: number;
  postId?: number | null;
  category: "upcoming" | "published" | "failed" | "account";
  title: string;
  body: string;
}) {
  const db = await requireDb();
  await db.insert(notifications).values(input);
}

export async function setPostChannelResult(
  channelId: number,
  result: { ok: true; externalPostId: string; publishUrl?: string } | { ok: false; error: string; providerStatusCode?: number }
) {
  const db = await requireDb();
  await db
    .update(postChannels)
    .set(
      result.ok
        ? { status: "published", externalPostId: result.externalPostId, publishUrl: result.publishUrl ?? null, publishedAt: new Date(), lastError: null }
        : { status: "failed", lastError: result.error }
    )
    .where(eq(postChannels.id, channelId));
}

export async function recordPublishingAttempt(input: {
  postId: number;
  postChannelId: number;
  userId: number;
  platform: string;
  outcome: "success" | "failure" | "skipped";
  errorMessage?: string | null;
  externalPostId?: string | null;
  providerStatusCode?: number | null;
}) {
  const db = await requireDb();
  await db.insert(publishingAttempts).values(input);
}
