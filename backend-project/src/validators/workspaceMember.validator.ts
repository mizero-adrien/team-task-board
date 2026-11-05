import { z } from "zod";
import { objectIdSchema } from "./common";

export const workspaceMemberParamsSchema = z.object({
  workspaceId: objectIdSchema,
  userId: objectIdSchema,
});

export const addMemberSchema = z
  .object({
    userId: objectIdSchema.optional(),
    email: z.email().trim().toLowerCase().optional(),
    role: z.enum(["owner", "member"]).default("member"),
  })
  .refine((data) => Boolean(data.userId) !== Boolean(data.email), {
    message: "Provide either userId or email, but not both",
  });

export const updateMemberRoleSchema = z.object({
  role: z.enum(["owner", "member"]),
});
