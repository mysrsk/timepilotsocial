import { beforeEach, describe, expect, it } from "vitest";
import { decryptSocialToken, encryptSocialToken } from "./socialTokens";

describe("social token encryption", () => {
  beforeEach(() => {
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("round-trips an OAuth token without persisting plaintext", () => {
    const encrypted = encryptSocialToken("native-access-token");
    expect(encrypted).not.toContain("native-access-token");
    expect(decryptSocialToken(encrypted)).toBe("native-access-token");
  });

  it("rejects malformed encrypted payloads", () => {
    expect(() => decryptSocialToken("not-a-valid-token")).toThrow("Malformed encrypted social token");
  });
});
