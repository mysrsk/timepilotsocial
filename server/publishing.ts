import type { SocialPlatform } from "../drizzle/schema";

export type NativePublishResult =
  | { ok: true; externalPostId: string; publishUrl?: string }
  | { ok: false; error: string; providerStatusCode?: number };

/**
 * All future native publishers conform to this boundary. Actual outbound requests remain disabled
 * until the owner adds verified native OAuth credentials and encrypted token support for each platform.
 */
export async function publishWithNativeAdapter(input: {
  platform: SocialPlatform;
  handle: string;
  body: string;
  encryptedAccessToken: string | null;
}): Promise<NativePublishResult> {
  if (!input.encryptedAccessToken) {
    return {
      ok: false,
      error: `${input.platform} is not fully authorized. Reconnect this account before publishing.`,
    };
  }

  return {
    ok: false,
    error:
      "Native publishing credentials are not configured yet. Add the platform OAuth credentials before enabling live publishing.",
  };
}
