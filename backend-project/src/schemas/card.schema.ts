import { z } from "zod";
import { isValidDateString } from "../utils/dates";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Must be a valid ID");

const title = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be at most 200 characters");

const description = z
  .string()
  .trim()
  .max(5000, "Description must be at most 5000 characters");

const dueDate = z
  .string()
  .refine(isValidDateString, "Due date must be a real date in YYYY-MM-DD format");

// Only these fields are accepted. board, list, workspace and createdBy
// are always taken from the parent documents by the SERVICE.
export const createCardSchema = z.object({
  title,
  description: description.optional(),
  dueDate: dueDate.nullable().optional(),
  assigneeId: objectId.nullable().optional(),
});

export const updateCardSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    dueDate: dueDate.nullable().optional(),
    assigneeId: objectId.nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Send at least one field to update"
  );

export const moveCardSchema = z.object({
  listId: objectId,
  afterCardId: objectId.nullable().optional(),
});

const bulkCard = z.object({
  title,
  description: description.optional(),
  listId: objectId,
  dueDate: dueDate.nullable().optional(),
});

export const bulkCardsSchema = z.object({
  batchId: z
    .string()
    .trim()
    .min(1, "Batch ID is required")
    .max(100, "Batch ID must be at most 100 characters"),
  cards: z
    .array(bulkCard)
    .min(1, "Add at least one card")
    .max(10, "Add at most 10 cards"),
});

export const mineCardsQuerySchema = z.object({
  workspaceId: objectId.optional(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type BulkCardsInput = z.infer<typeof bulkCardsSchema>;
export type MineCardsQuery = z.infer<typeof mineCardsQuerySchema>;
