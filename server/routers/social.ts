import { parse as parseCookie } from "cookie";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type SocialPlatform } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import { resolveLocalDateTime, utcCronForOneTimePost } from "../../shared/timezones";
import * as db from "../db";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { protectedProcedure, router } from "../_core/trpc";
import { buildNativeAuthorizationUrl, createOAuthState, createPkcePair, nativeOAuthStatus } from "../nativeOauth";
import { encryptSocialToken } from "../socialTokens";

const platformSchema = z.enum(["x", "instagram", "linkedin", "facebook"]);
const scheduleInput = z.object({
  body: z.string().trim().min(1).max(10_000),
  accountIds: z.array(z.number().int().positive()).min(1),
  mediaAssetIds: z.array(z.number().int().positive()).max(10).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  timeZone: z.string().min(1).max(64),
});

function userSession(cookieHeader: string | undefined) {
  return parseCookie(cookieHeader ?? "")[COOKIE_NAME] ?? "";
}

function handleError(error: unknown) {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The request could not be completed." });
}

export function buildUpcomingNotification(input: {
  workspaceId: number;
  userId: number;
  postId: number;
  resolvedLocalTime: string;
  timeZone: string;
}) {
  return {
    workspaceId: input.workspaceId,
    userId: input.userId,
    postId: input.postId,
    category: "upcoming" as const,
    title: "Post scheduled",
    body: `Your content is scheduled for ${input.resolvedLocalTime} in ${input.timeZone}.`,
  };
}

export const socialRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => db.getDashboardSnapshot(ctx.user.id, ctx.user.name ?? undefined)),
  accounts: router({
    list: protectedProcedure.query(({ ctx }) => db.listSocialAccounts(ctx.user.id)),
    attachHandle: protectedProcedure
      .input(z.object({ platform: platformSchema, handle: z.string().trim().min(2).max(190), displayName: z.string().trim().max(190).optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const workspace = await db.ensureWorkspaceForUser(ctx.user.id, ctx.user.name ?? undefined);
          return await db.attachSocialHandle({ ...input, platform: input.platform as SocialPlatform, userId: ctx.user.id, workspaceId: workspace.id });
        } catch (error) {
          return handleError(error);
        }
      }),
    disconnect: protectedProcedure.input(z.object({ accountId: z.number().int().positive() })).mutation(({ ctx, input }) => db.detachSocialAccount(ctx.user.id, input.accountId)),
    nativeConnectionGuide: protectedProcedure.input(z.object({ platform: platformSchema })).query(({ input }) => ({
      ...nativeOAuthStatus(input.platform as SocialPlatform),
      message: "Native authorization uses verified OAuth credentials, PKCE where required, encrypted token storage, and a one-time callback state.",
    })),
    startNativeAuthorization: protectedProcedure.input(z.object({ accountId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await db.getSocialAccountForUser(ctx.user.id, input.accountId);
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "The social account was not found." });
      const status = nativeOAuthStatus(account.platform);
      if (!status.configured) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Native ${account.platform} OAuth must be configured by the workspace owner before connecting this account.` });
      const workspace = await db.ensureWorkspaceForUser(ctx.user.id, ctx.user.name ?? undefined);
      const state = createOAuthState();
      const pkce = createPkcePair();
      await db.createNativeAuthorization({ workspaceId: workspace.id, userId: ctx.user.id, socialAccountId: account.id, platform: account.platform, state, encryptedCodeVerifier: encryptSocialToken(pkce.verifier) });
      return { authorizationUrl: buildNativeAuthorizationUrl({ platform: account.platform, state, codeChallenge: pkce.challenge }) };
    }),
  }),
  content: router({
    uploadMedia: protectedProcedure.input(z.object({
      fileName: z.string().trim().min(1).max(200),
      mimeType: z.string().regex(/^(image|video)\/[a-zA-Z0-9.+-]+$/),
      base64: z.string().min(1).max(11_200_000),
    })).mutation(async ({ ctx, input }) => {
      try {
        const byteLength = Buffer.byteLength(input.base64, "base64");
        if (byteLength > 8 * 1024 * 1024) throw new Error("Choose a media file smaller than 8 MB.");
        const workspace = await db.ensureWorkspaceForUser(ctx.user.id, ctx.user.name ?? undefined);
        return await db.createMediaAsset({ ...input, userId: ctx.user.id, workspaceId: workspace.id });
      } catch (error) {
        return handleError(error);
      }
    }),
    saveDraft: protectedProcedure.input(z.object({ body: z.string().trim().min(1).max(10_000), mediaAssetIds: z.array(z.number().int().positive()).max(10).default([]) })).mutation(async ({ ctx, input }) => {
      const workspace = await db.ensureWorkspaceForUser(ctx.user.id, ctx.user.name ?? undefined);
      return db.createDraft({ userId: ctx.user.id, workspaceId: workspace.id, body: input.body, mediaAssetIds: input.mediaAssetIds });
    }),
    schedule: protectedProcedure.input(scheduleInput).mutation(async ({ ctx, input }) => {
      try {
        const resolved = resolveLocalDateTime({ date: input.date, time: input.time, timeZone: input.timeZone });
        if (resolved.utcDate <= new Date()) throw new Error("Choose a future publication time.");
        const workspace = await db.ensureWorkspaceForUser(ctx.user.id, ctx.user.name ?? undefined);
        const post = await db.createScheduledPost({
          userId: ctx.user.id,
          workspaceId: workspace.id,
          body: input.body,
          timezone: input.timeZone,
          localTime: resolved.resolvedLocalTime,
          scheduledFor: resolved.utcDate,
          accountIds: input.accountIds,
          mediaAssetIds: input.mediaAssetIds,
        });
        await db.createNotification(buildUpcomingNotification({
          workspaceId: workspace.id,
          userId: ctx.user.id,
          postId: post.id,
          resolvedLocalTime: resolved.resolvedLocalTime,
          timeZone: input.timeZone,
        }));
        if (process.env.NODE_ENV !== "production") {
          return { post, resolved, schedulingStatus: "deployment-required" as const };
        }
        const job = await createHeartbeatJob({
          name: `timepilot-post-${post.id}-${resolved.utcDate.getTime()}`,
          cron: utcCronForOneTimePost(resolved.utcDate),
          path: "/api/scheduled/publish-post",
          payload: { postId: post.id },
          description: `Publish scheduled TimePilot post ${post.id}`,
        }, userSession(ctx.req.headers.cookie));
        await db.setPostScheduleTask(ctx.user.id, post.id, job.taskUid);
        return { post, resolved, schedulingStatus: "armed" as const, nextExecutionAt: job.nextExecutionAt ?? null };
      } catch (error) {
        return handleError(error);
      }
    }),
    reschedule: protectedProcedure
      .input(z.object({ postId: z.number().int().positive(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), timeZone: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        try {
          const post = await db.getPostForUser(ctx.user.id, input.postId);
          if (!post) throw new Error("The scheduled post was not found.");
          const resolved = resolveLocalDateTime({ date: input.date, time: input.time, timeZone: input.timeZone });
          if (resolved.utcDate <= new Date()) throw new Error("Choose a future publication time.");
          if (process.env.NODE_ENV === "production" && post.scheduleCronTaskUid) {
            await updateHeartbeatJob(post.scheduleCronTaskUid, { cron: utcCronForOneTimePost(resolved.utcDate) }, userSession(ctx.req.headers.cookie));
          }
          return db.updateScheduledPost({ userId: ctx.user.id, postId: post.id, timezone: input.timeZone, localTime: resolved.resolvedLocalTime, scheduledFor: resolved.utcDate });
        } catch (error) {
          return handleError(error);
        }
      }),
    edit: protectedProcedure
      .input(z.object({ postId: z.number().int().positive(), body: z.string().trim().min(1).max(10_000) }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.updatePostBodyForUser(ctx.user.id, input.postId, input.body);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "The post was not found." });
        return post;
      }),
    remove: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const post = await db.getPostForUser(ctx.user.id, input.postId);
      if (!post) return;
      if (process.env.NODE_ENV === "production" && post.scheduleCronTaskUid) {
        await deleteHeartbeatJob(post.scheduleCronTaskUid, userSession(ctx.req.headers.cookie));
      }
      await db.deletePostForUser(ctx.user.id, input.postId);
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => db.markNotificationRead(ctx.user.id, input.notificationId)),
  }),
});
