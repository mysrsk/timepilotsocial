import { describe, expect, it } from "vitest";
import { assertUserOwned } from "./access";

describe("assertUserOwned", () => {
  it("returns a resource only for its owning user", () => {
    const post = { id: 42, userId: 7, body: "Private draft" };
    expect(assertUserOwned(post, 7)).toEqual(post);
  });

  it("conceals a resource owned by another user", () => {
    expect(() => assertUserOwned({ id: 42, userId: 7 }, 8)).toThrow("not found");
  });

  it("conceals a missing resource", () => {
    expect(() => assertUserOwned(undefined, 7)).toThrow("not found");
  });
});
