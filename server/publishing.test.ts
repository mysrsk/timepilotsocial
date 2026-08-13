import { describe, expect, it } from "vitest";
import { publishWithNativeAdapter } from "./publishing";

describe("native publishing adapters", () => {
  it("returns a platform-specific authorization error without a connected token", async () => {
    await expect(publishWithNativeAdapter({ platform: "linkedin", handle: "@team", body: "A post", encryptedAccessToken: null, socialAccountId: 12, userId: 7 })).resolves.toMatchObject({ ok: false, error: "linkedin is not fully authorized. Reconnect this account before publishing." });
  });
});
