import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common";

export const workspaceIdParamsSchema = z.object({
  workspaceId: objectIdSchema,
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).nullish(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(300).nullish(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const listWorkspacesQuerySchema = paginationSchema;
