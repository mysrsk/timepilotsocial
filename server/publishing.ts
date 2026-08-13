import { type SocialPlatform } from "../drizzle/schema";
import { updateNativeTokenSet } from "./db";
import { nativeOAuthStatus, refreshNativeAccessToken } from "./nativeOauth";
import { decryptSocialToken, encryptSocialToken } from "./socialTokens";

export type NativePublishResult =
  | { ok: true; externalPostId: string; publishUrl?: string }
  | { ok: false; error: string; providerStatusCode?: number };

/**
 * Native publishing providers conform to one boundary while retaining platform-specific scopes,
 * authorization requirements, and explicit configuration errors.
 */
export async function publishWithNativeAdapter(input: {
  platform: SocialPlatform;
  handle: string;
  body: string;
  encryptedAccessToken: string | null;
  encryptedRefreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  socialAccountId: number;
  userId: number;
}): Promise<NativePublishResult> {
  if (!input.encryptedAccessToken) {
    return {
      ok: false,
      error: `${input.platform} is not fully authorized. Reconnect this account before publishing.`,
    };
  }
  const status = nativeOAuthStatus(input.platform);
  if (!status.configured) return { ok: false, error: `Native ${input.platform} publishing is not configured by the workspace owner.` };
  const accessToken = await prepareAccessToken(input);
  return platformPublishers[input.platform]({ handle: input.handle, body: input.body, accessToken });
}

async function prepareAccessToken(input: Parameters<typeof publishWithNativeAdapter>[0]) {
  const tokenExpiresSoon = input.tokenExpiresAt && input.tokenExpiresAt.getTime() <= Date.now() + 5 * 60 * 1000;
  if (!tokenExpiresSoon) return decryptSocialToken(input.encryptedAccessToken!);
  if (!input.encryptedRefreshToken) throw new Error(`${input.platform} access expired and has no refresh token. Reconnect this account.`);
  const refreshed = await refreshNativeAccessToken({ platform: input.platform, refreshToken: decryptSocialToken(input.encryptedRefreshToken) });
  await updateNativeTokenSet({ userId: input.userId, socialAccountId: input.socialAccountId, encryptedAccessToken: encryptSocialToken(refreshed.accessToken), encryptedRefreshToken: refreshed.refreshToken ? encryptSocialToken(refreshed.refreshToken) : input.encryptedRefreshToken, tokenExpiresAt: refreshed.expiresAt ?? null });
  return refreshed.accessToken;
}

type PlatformPublisher = (input: { handle: string; body: string; accessToken: string }) => Promise<NativePublishResult>;
const authorizationError = (platform: string) => ({ ok: false as const, error: `${platform} publish adapter requires verified production publishing permissions before content can be delivered.` });
const platformPublishers: Record<SocialPlatform, PlatformPublisher> = {
  x: async () => authorizationError("X"),
  instagram: async () => authorizationError("Instagram"),
  linkedin: async () => authorizationError("LinkedIn"),
  facebook: async () => authorizationError("Facebook"),
};
