import { z } from "zod";
import { objectIdSchema } from "./common";

export const inviteWorkspaceParamsSchema = z.object({
  workspaceId: objectIdSchema,
});

export const workspaceInviteParamsSchema = z.object({
  workspaceId: objectIdSchema,
  inviteId: objectIdSchema,
});

export const createInviteSchema = z.object({
  email: z.email().trim().toLowerCase().nullish(),
  maxUses: z.number().int().min(1).max(100).default(1),
  expiresInHours: z.number().int().min(1).max(720).default(72),
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(16),
});

export const previewInviteSchema = z.object({
  token: z.string().trim().min(16),
});
