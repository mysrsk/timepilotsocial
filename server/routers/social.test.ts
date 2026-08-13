import { describe, expect, it } from "vitest";
import { buildUpcomingNotification } from "./social";

describe("scheduled-post notifications", () => {
  it("creates a user-scoped upcoming alert with the resolved local schedule", () => {
    expect(
      buildUpcomingNotification({
        workspaceId: 4,
        userId: 8,
        postId: 16,
        resolvedLocalTime: "2026-11-01T01:30",
        timeZone: "America/New_York",
      })
    ).toEqual({
      workspaceId: 4,
      userId: 8,
      postId: 16,
      category: "upcoming",
      title: "Post scheduled",
      body: "Your content is scheduled for 2026-11-01T01:30 in America/New_York.",
    });
  });
});
