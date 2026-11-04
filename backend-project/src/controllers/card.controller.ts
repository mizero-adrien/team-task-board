import type { Request } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { HttpError } from "../utils/HttpError";
import {
  bulkCreateCards,
  createCard,
  deleteCard,
  getCard,
  listMyCards,
  moveCard,
  updateCard,
  type Actor,
} from "../services/card.service";
import {
  mineCardsQuerySchema,
  type BulkCardsInput,
  type CreateCardInput,
  type MoveCardInput,
  type UpdateCardInput,
} from "../schemas/card.schema";

function actorFrom(req: Request): Actor {
  if (!req.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Please sign in to continue");
  }

  return { id: req.user.id, name: req.user.name };
}

function paramFrom(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new HttpError(400, "VALIDATION_FAILED", "Validation failed", {
      errors: [{ field: name, message: "Must be a valid ID" }],
    });
  }

  return value;
}

export const create = asyncHandler(async (req, res) => {
  const card = await createCard(
    paramFrom(req, "listId"),
    actorFrom(req),
    req.body as CreateCardInput
  );

  res.status(201).json(card);
});

export const mine = asyncHandler(async (req, res) => {
  const query = mineCardsQuerySchema.safeParse(req.query);

  if (!query.success) {
    throw new HttpError(400, "VALIDATION_FAILED", "Validation failed", {
      errors: query.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const cards = await listMyCards(actorFrom(req), query.data.workspaceId);

  res.json(cards);
});

export const get = asyncHandler(async (req, res) => {
  const card = await getCard(paramFrom(req, "cardId"), actorFrom(req));

  res.json(card);
});

export const update = asyncHandler(async (req, res) => {
  const card = await updateCard(
    paramFrom(req, "cardId"),
    actorFrom(req),
    req.body as UpdateCardInput
  );

  res.json(card);
});

export const move = asyncHandler(async (req, res) => {
  const card = await moveCard(
    paramFrom(req, "cardId"),
    actorFrom(req),
    req.body as MoveCardInput
  );

  res.json(card);
});

export const remove = asyncHandler(async (req, res) => {
  await deleteCard(paramFrom(req, "cardId"), actorFrom(req));

  res.status(204).send();
});

export const bulkCreate = asyncHandler(async (req, res) => {
  const result = await bulkCreateCards(
    paramFrom(req, "boardId"),
    actorFrom(req),
    req.body as BulkCardsInput
  );

  res.status(201).json(result);
});
