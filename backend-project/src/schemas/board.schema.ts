import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Board name is required")
  .max(80, "Board name must be at most 80 characters");

const description = z
  .string()
  .trim()
  .max(500, "Description must be at most 500 characters")
  .nullable();

export const createBoardSchema = z.object({ name, description: description.optional() });

export const updateBoardSchema = z
  .object({ name: name.optional(), description: description.optional() })
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: "Send at least one field to change",
  });

export type CreateBoardBody = z.infer<typeof createBoardSchema>;
export type UpdateBoardBody = z.infer<typeof updateBoardSchema>;
