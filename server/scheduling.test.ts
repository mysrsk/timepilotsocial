import { describe, expect, it } from "vitest";
import { assertUserOwned } from "./access";
import { resolveLocalDateTime, utcCronForOneTimePost } from "../shared/timezones";

describe("DST-safe scheduling", () => {
  it("converts Eastern daytime offsets automatically across daylight saving time", () => {
    const summer = resolveLocalDateTime({
      date: "2026-07-15",
      time: "09:00",
      timeZone: "America/New_York",
    });
    const winter = resolveLocalDateTime({
      date: "2026-01-15",
      time: "09:00",
      timeZone: "America/New_York",
    });
    expect(summer.utcDate.toISOString()).toBe("2026-07-15T13:00:00.000Z");
    expect(winter.utcDate.toISOString()).toBe("2026-01-15T14:00:00.000Z");
  });

  it("automatically advances nonexistent spring-forward local times", () => {
    const resolved = resolveLocalDateTime({
      date: "2026-03-08",
      time: "02:30",
      timeZone: "America/New_York",
    });
    expect(resolved.adjustedForDstGap).toBe(true);
    expect(resolved.resolvedLocalTime).toBe("2026-03-08T03:00");
  });

  it("creates cron schedules in UTC and requires a matching owner", () => {
    const instant = new Date("2026-07-15T13:00:00.000Z");
    expect(utcCronForOneTimePost(instant)).toBe("0 0 13 15 7 *");
    expect(assertUserOwned({ id: 12, userId: 42 }, 42).id).toBe(12);
    expect(() => assertUserOwned({ id: 12, userId: 42 }, 84)).toThrow("not found");
  });
});
