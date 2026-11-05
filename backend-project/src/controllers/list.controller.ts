import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import {
  createList,
  deleteList,
  moveList,
  updateList,
  type Actor,
} from "../services/list.service";
import {
  deleteListQuerySchema,
  type CreateListInput,
  type MoveListInput,
  type UpdateListInput,
} from "../schemas/list.schema";

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
  const list = await createList(
    paramFrom(req, "boardId"),
    actorFrom(req),
    req.body as CreateListInput,
  );

  res.status(201).json(list);
});

export const update = asyncHandler(async (req, res) => {
  const list = await updateList(
    paramFrom(req, "listId"),
    actorFrom(req),
    req.body as UpdateListInput,
  );

  res.json(list);
});

export const move = asyncHandler(async (req, res) => {
  const list = await moveList(
    paramFrom(req, "listId"),
    actorFrom(req),
    req.body as MoveListInput,
  );

  res.json(list);
});

export const remove = asyncHandler(async (req, res) => {
  const query = deleteListQuerySchema.safeParse(req.query);

  if (!query.success) {
    throw new HttpError(400, "VALIDATION_FAILED", "Validation failed", {
      errors: query.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  await deleteList(paramFrom(req, "listId"), actorFrom(req), query.data.moveCardsTo);

  res.status(204).send();
});
