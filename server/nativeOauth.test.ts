import { beforeEach, describe, expect, it } from "vitest";
import { buildNativeAuthorizationUrl, nativeOAuthStatus } from "./nativeOauth";

describe("native OAuth configuration", () => {
  beforeEach(() => {
    process.env.X_CLIENT_ID = "x-client";
    process.env.X_CLIENT_SECRET = "x-secret";
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
    process.env.SOCIAL_OAUTH_REDIRECT_ORIGIN = "https://app.example.com";
  });

  it("builds a provider authorization URL with platform scopes and an opaque state", () => {
    const url = new URL(buildNativeAuthorizationUrl({ platform: "x", state: "opaque-state", codeChallenge: "challenge" }));
    expect(url.origin).toBe("https://twitter.com");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.example.com/api/social/oauth/callback/x");
    expect(url.searchParams.get("scope")).toContain("tweet.write");
    expect(url.searchParams.get("state")).toBe("opaque-state");
  });

  it("reports whether a native provider can be enabled safely", () => {
    expect(nativeOAuthStatus("x").configured).toBe(true);
  });
});
