import { describe, expect, it } from "vitest";
import { wasScheduledPostClaimed } from "./scheduledPublishing";

describe("scheduled publish claim", () => {
  it("permits exactly the callback that atomically moves a scheduled post into publishing", () => {
    expect(wasScheduledPostClaimed({ affectedRows: 1 })).toBe(true);
    expect(wasScheduledPostClaimed({ affectedRows: 0 })).toBe(false);
  });

  it("supports the MySQL driver result shape used by the scheduled callback", () => {
    expect(wasScheduledPostClaimed([{ affectedRows: 1 }, {}])).toBe(true);
    expect(wasScheduledPostClaimed([{ affectedRows: 0 }, {}])).toBe(false);
  });
});
