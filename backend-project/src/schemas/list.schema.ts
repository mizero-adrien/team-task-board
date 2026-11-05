import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Must be a valid ID");

const listName = z
  .string()
  .trim()
  .min(1, "List name cannot be empty")
  .max(50, "List name must be at most 50 characters");

export const createListSchema = z.object({
  name: listName,
  afterListId: objectId.nullable().optional(),
});

export const updateListSchema = z
  .object({
    name: listName.optional(),
    isDone: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Send at least one field to update",
  );

export const moveListSchema = z.object({
  afterListId: objectId.nullable().optional(),
});

export const deleteListQuerySchema = z.object({
  moveCardsTo: objectId.optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type MoveListInput = z.infer<typeof moveListSchema>;
export type DeleteListQuery = z.infer<typeof deleteListQuerySchema>;
