import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { postChannels, posts, socialAccounts } from "../drizzle/schema";
import { getDb, createNotification, recordPublishingAttempt, setPostChannelResult } from "./db";
import { publishWithNativeAdapter } from "./publishing";
import { sdk } from "./_core/sdk";

export function wasScheduledPostClaimed(result: unknown): boolean {
  const payload = Array.isArray(result) ? result[0] : result;
  return Boolean((payload as { affectedRows?: number } | undefined)?.affectedRows);
}

export async function scheduledPublishHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    taskUid = cronUser.taskUid;
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database-unavailable" });

    const scheduledPost = (
      await db
        .select()
        .from(posts)
        .where(eq(posts.scheduleCronTaskUid, taskUid))
        .limit(1)
    )[0];
    if (!scheduledPost) return res.json({ ok: true, skipped: "orphan" });
    if (scheduledPost.status !== "scheduled") {
      return res.json({ ok: true, skipped: `already-${scheduledPost.status}` });
    }

    const claimResult = await db
      .update(posts)
      .set({ status: "publishing", lastError: null })
      .where(and(eq(posts.id, scheduledPost.id), eq(posts.status, "scheduled")));
    if (!wasScheduledPostClaimed(claimResult)) {
      return res.json({ ok: true, skipped: "already-claimed" });
    }

    const channels = await db
      .select({ channel: postChannels, account: socialAccounts })
      .from(postChannels)
      .innerJoin(socialAccounts, eq(postChannels.socialAccountId, socialAccounts.id))
      .where(eq(postChannels.postId, scheduledPost.id));

    const results = await Promise.all(
      channels.map(async ({ channel, account }) => {
        const result = await publishWithNativeAdapter({
          platform: channel.platform,
          handle: account.handle,
          body: scheduledPost.body,
          encryptedAccessToken: account.encryptedAccessToken,
          encryptedRefreshToken: account.encryptedRefreshToken,
          tokenExpiresAt: account.tokenExpiresAt,
          socialAccountId: account.id,
          userId: scheduledPost.userId,
        });
        await setPostChannelResult(channel.id, result);
        await recordPublishingAttempt({
          postId: scheduledPost.id,
          postChannelId: channel.id,
          userId: scheduledPost.userId,
          platform: channel.platform,
          outcome: result.ok ? "success" : "failure",
          errorMessage: result.ok ? null : result.error,
          externalPostId: result.ok ? result.externalPostId : null,
          providerStatusCode: result.ok ? null : result.providerStatusCode ?? null,
        });
        return result;
      })
    );

    const failures = results.filter(result => !result.ok);
    const wasSuccessful = failures.length === 0;
    await db
      .update(posts)
      .set({
        status: wasSuccessful ? "published" : "failed",
        publishedAt: wasSuccessful ? new Date() : null,
        failedAt: wasSuccessful ? null : new Date(),
        lastError: wasSuccessful ? null : failures.map(item => item.error).join(" "),
      })
      .where(eq(posts.id, scheduledPost.id));

    await createNotification({
      workspaceId: scheduledPost.workspaceId,
      userId: scheduledPost.userId,
      postId: scheduledPost.id,
      category: wasSuccessful ? "published" : "failed",
      title: wasSuccessful ? "Post published" : "Publishing needs attention",
      body: wasSuccessful
        ? "Your scheduled content was published to every selected destination."
        : "One or more destinations could not publish this scheduled post. Review the queue for details.",
    });

    return res.json({ ok: true, postId: scheduledPost.id, successful: wasSuccessful });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
