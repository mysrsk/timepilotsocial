import { createHash, randomBytes } from "node:crypto";
import { type SocialPlatform } from "../drizzle/schema";

type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  usesPkce: boolean;
};

const providers: Record<SocialPlatform, ProviderConfig> = {
  x: { authorizeUrl: "https://twitter.com/i/oauth2/authorize", tokenUrl: "https://api.twitter.com/2/oauth2/token", clientIdEnv: "X_CLIENT_ID", clientSecretEnv: "X_CLIENT_SECRET", scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"], usesPkce: true },
  instagram: { authorizeUrl: "https://www.facebook.com/v20.0/dialog/oauth", tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token", clientIdEnv: "META_APP_ID", clientSecretEnv: "META_APP_SECRET", scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list"], usesPkce: false },
  linkedin: { authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization", tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken", clientIdEnv: "LINKEDIN_CLIENT_ID", clientSecretEnv: "LINKEDIN_CLIENT_SECRET", scopes: ["openid", "profile", "w_member_social"], usesPkce: false },
  facebook: { authorizeUrl: "https://www.facebook.com/v20.0/dialog/oauth", tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token", clientIdEnv: "META_APP_ID", clientSecretEnv: "META_APP_SECRET", scopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"], usesPkce: false },
};

export type NativeTokenSet = { accessToken: string; refreshToken?: string; expiresAt?: Date; grantedScopes?: string; metadata?: string };

export function nativeOAuthStatus(platform: SocialPlatform) {
  const provider = providers[platform];
  return { platform, requiredEnvironmentVariables: [provider.clientIdEnv, provider.clientSecretEnv, "SOCIAL_TOKEN_ENCRYPTION_KEY", "SOCIAL_OAUTH_REDIRECT_ORIGIN"], configured: Boolean(process.env[provider.clientIdEnv] && process.env[provider.clientSecretEnv] && process.env.SOCIAL_TOKEN_ENCRYPTION_KEY && process.env.SOCIAL_OAUTH_REDIRECT_ORIGIN) };
}

export function getNativeCallbackUri(platform: SocialPlatform) {
  const origin = process.env.SOCIAL_OAUTH_REDIRECT_ORIGIN;
  if (!origin) throw new Error("SOCIAL_OAUTH_REDIRECT_ORIGIN must be configured before starting native authorization.");
  return `${origin.replace(/\/$/, "")}/api/social/oauth/callback/${platform}`;
}

export function createPkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createOAuthState() { return randomBytes(32).toString("base64url"); }

export function buildNativeAuthorizationUrl(input: { platform: SocialPlatform; state: string; codeChallenge?: string }) {
  const provider = providers[input.platform];
  const clientId = process.env[provider.clientIdEnv];
  if (!clientId) throw new Error(`${provider.clientIdEnv} must be configured before starting native authorization.`);
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getNativeCallbackUri(input.platform));
  url.searchParams.set("scope", provider.scopes.join(" "));
  url.searchParams.set("state", input.state);
  if (provider.usesPkce) { if (!input.codeChallenge) throw new Error("A PKCE code challenge is required for X authorization."); url.searchParams.set("code_challenge", input.codeChallenge); url.searchParams.set("code_challenge_method", "S256"); }
  return url.toString();
}

export async function exchangeNativeAuthorizationCode(input: { platform: SocialPlatform; code: string; codeVerifier: string }) : Promise<NativeTokenSet> {
  const provider = providers[input.platform];
  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];
  if (!clientId || !clientSecret) throw new Error(`Native ${input.platform} client credentials are not configured.`);
  const form = new URLSearchParams({ grant_type: "authorization_code", code: input.code, redirect_uri: getNativeCallbackUri(input.platform), client_id: clientId, client_secret: clientSecret });
  if (provider.usesPkce) form.set("code_verifier", input.codeVerifier);
  const response = await fetch(provider.tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error(`${input.platform} token exchange failed with HTTP ${response.status}.`);
  const payload = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };
  if (!payload.access_token) throw new Error(`${input.platform} token exchange did not return an access token.`);
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token, expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : undefined, grantedScopes: payload.scope, metadata: JSON.stringify({ tokenType: payload.token_type ?? null, provider: input.platform }) };
}

export async function refreshNativeAccessToken(input: { platform: SocialPlatform; refreshToken: string }): Promise<NativeTokenSet> {
  const provider = providers[input.platform];
  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];
  if (!clientId || !clientSecret) throw new Error(`Native ${input.platform} client credentials are not configured.`);
  const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: input.refreshToken, client_id: clientId, client_secret: clientSecret });
  const response = await fetch(provider.tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error(`${input.platform} token refresh failed with HTTP ${response.status}.`);
  const payload = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };
  if (!payload.access_token) throw new Error(`${input.platform} token refresh did not return an access token.`);
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token ?? input.refreshToken, expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : undefined, grantedScopes: payload.scope, metadata: JSON.stringify({ tokenType: payload.token_type ?? null, provider: input.platform }) };
}
