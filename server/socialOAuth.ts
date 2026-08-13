import type { Express } from "express";
import { type SocialPlatform } from "../drizzle/schema";
import * as db from "./db";
import { decryptSocialToken, encryptSocialToken } from "./socialTokens";
import { exchangeNativeAuthorizationCode } from "./nativeOauth";

const platforms = new Set<SocialPlatform>(["x", "instagram", "linkedin", "facebook"]);

export function registerNativeSocialOAuthRoutes(app: Express) {
  app.get("/api/social/oauth/callback/:platform", async (req, res) => {
    const platform = req.params.platform as SocialPlatform;
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    if (!platforms.has(platform) || !code || !state) return res.status(400).send("Invalid native authorization callback.");
    try {
      const authorization = await db.consumeNativeAuthorization(state);
      if (!authorization || authorization.platform !== platform) return res.status(400).send("This native authorization request has expired or was already used.");
      const tokenSet = await exchangeNativeAuthorizationCode({ platform, code, codeVerifier: decryptSocialToken(authorization.encryptedCodeVerifier) });
      await db.completeNativeAuthorization({ authorization, encryptedAccessToken: encryptSocialToken(tokenSet.accessToken), encryptedRefreshToken: tokenSet.refreshToken ? encryptSocialToken(tokenSet.refreshToken) : null, tokenExpiresAt: tokenSet.expiresAt ?? null, grantedScopes: tokenSet.grantedScopes ?? null, connectionMetadata: tokenSet.metadata ?? null });
      return res.redirect("/accounts?connected=" + platform);
    } catch (error) {
      return res.status(500).send(error instanceof Error ? error.message : "Native authorization failed.");
    }
  });
}
