import { TRPCError } from "@trpc/server";

export function assertUserOwned<T extends { userId: number }>(resource: T | undefined, userId: number) {
  if (!resource || resource.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "The requested resource was not found." });
  }
  return resource;
}
