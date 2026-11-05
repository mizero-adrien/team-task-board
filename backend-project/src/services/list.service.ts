import { Types } from "mongoose";
import { Board } from "../models/Board";
import { Card } from "../models/Card";
import { List, LIST_POSITION_STEP, type ListDocument } from "../models/List";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { HttpError } from "../utils/HttpError";
import type {
  CreateListInput,
  MoveListInput,
  UpdateListInput,
} from "../schemas/list.schema";
import { logActivity } from "./activity.service";

const LIST_LIMIT = 20;
const CARD_LIMIT = 200;
const CARD_POSITION_STEP = 1024;

export type Actor = { id: string; name: string };

export type ListResponse = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isDone: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toListResponse(list: ListDocument): ListResponse {
  return {
    id: String(list._id),
    boardId: String(list.boardId),
    name: list.name,
    position: list.position,
    isDone: list.isDone,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertMember(
  workspaceId: Types.ObjectId,
  userId: string,
  message: string,
): Promise<void> {
  const membership = await WorkspaceMember.exists({ workspaceId, userId });

  if (!membership) {
    throw new HttpError(404, "NOT_FOUND", message);
  }
}

async function loadListForMember(listId: string, userId: string) {
  const list = await List.findById(listId);

  if (!list) {
    throw new HttpError(404, "NOT_FOUND", "List not found");
  }

  const board = await Board.findById(list.boardId);

  if (!board) {
    throw new HttpError(404, "NOT_FOUND", "List not found");
  }

  await assertMember(board.workspaceId, userId, "List not found");

  return { list, board };
}

async function assertNameAvailable(
  boardId: string,
  name: string,
  excludeListId?: string,
): Promise<void> {
  const filter: Record<string, unknown> = {
    boardId,
    name: new RegExp(`^${escapeRegex(name)}$`, "i"),
  };

  if (excludeListId) {
    filter._id = { $ne: excludeListId };
  }

  const existing = await List.exists(filter);

  if (existing) {
    throw new HttpError(
      409,
      "LIST_NAME_TAKEN",
      "A list with this name already exists on this board",
    );
  }
}

async function reorderLists(boardId: string, orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;

  await List.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, boardId },
        update: { $set: { position: (index + 1) * LIST_POSITION_STEP } },
      },
    })),
  );
}

export async function createList(
  boardId: string,
  actor: Actor,
  input: CreateListInput,
): Promise<ListResponse> {
  const board = await Board.findById(boardId);

  if (!board) {
    throw new HttpError(404, "NOT_FOUND", "Board not found");
  }

  await assertMember(board.workspaceId, actor.id, "Board not found");

  const listCount = await List.countDocuments({ boardId });

  if (listCount >= LIST_LIMIT) {
    throw new HttpError(409, "LIST_LIMIT", "This board already has 20 lists");
  }

  await assertNameAvailable(boardId, input.name);

  const existing = await List.find({ boardId }).sort({ position: 1 }).select("_id");
  const orderedIds = existing.map((list) => String(list._id));
  let insertIndex = orderedIds.length;

  if (input.afterListId) {
    const afterIndex = orderedIds.indexOf(input.afterListId);

    if (afterIndex === -1) {
      throw new HttpError(
        400,
        "LIST_NOT_ON_BOARD",
        "The list to place after is not on this board",
      );
    }

    insertIndex = afterIndex + 1;
  }

  const newId = new Types.ObjectId();
  orderedIds.splice(insertIndex, 0, String(newId));

  const list = await List.create({
    _id: newId,
    boardId: board._id,
    name: input.name,
    position: (insertIndex + 1) * LIST_POSITION_STEP,
    isDone: false,
  });

  try {
    await reorderLists(boardId, orderedIds);
  } catch (error) {
    await List.findByIdAndDelete(newId);
    throw error;
  }

  await logActivity({
    workspace: board.workspaceId,
    board: board._id,
    actor,
    type: "list.created",
    meta: { listName: list.name },
  });

  return toListResponse(list);
}

export async function updateList(
  listId: string,
  actor: Actor,
  input: UpdateListInput,
): Promise<ListResponse> {
  const { list, board } = await loadListForMember(listId, actor.id);
  const previousName = list.name;

  if (input.name !== undefined && input.name !== list.name) {
    await assertNameAvailable(String(list.boardId), input.name, listId);
    list.name = input.name;
  }

  if (input.isDone !== undefined) {
    list.isDone = input.isDone;
  }

  await list.save();

  if (list.name !== previousName) {
    await logActivity({
      workspace: board.workspaceId,
      board: board._id,
      actor,
      type: "list.renamed",
      meta: { from: previousName, to: list.name },
    });
  }

  return toListResponse(list);
}

export async function moveList(
  listId: string,
  actor: Actor,
  input: MoveListInput,
): Promise<ListResponse> {
  const { list, board } = await loadListForMember(listId, actor.id);
  const existing = await List.find({ boardId: list.boardId })
    .sort({ position: 1 })
    .select("_id");
  const orderedIds = existing
    .map((item) => String(item._id))
    .filter((id) => id !== listId);

  if (input.afterListId === null) {
    orderedIds.unshift(listId);
  } else if (input.afterListId !== undefined) {
    const afterIndex = orderedIds.indexOf(input.afterListId);

    if (afterIndex === -1) {
      throw new HttpError(
        400,
        "LIST_NOT_ON_BOARD",
        "The list to place after is not on this board",
      );
    }

    orderedIds.splice(afterIndex + 1, 0, listId);
  } else {
    orderedIds.push(listId);
  }

  await reorderLists(String(list.boardId), orderedIds);

  const updated = await List.findById(listId);

  if (!updated) {
    throw new HttpError(404, "NOT_FOUND", "List not found");
  }

  await logActivity({
    workspace: board.workspaceId,
    board: board._id,
    actor,
    type: "list.reordered",
    meta: { listName: updated.name },
  });

  return toListResponse(updated);
}

export async function deleteList(
  listId: string,
  actor: Actor,
  moveCardsTo?: string,
): Promise<void> {
  const { list, board } = await loadListForMember(listId, actor.id);
  const cardCount = await Card.countDocuments({ list: list._id });

  if (cardCount > 0) {
    if (!moveCardsTo) {
      throw new HttpError(
        409,
        "LIST_NOT_EMPTY",
        "This list still has cards. Move them to another list first",
      );
    }

    const target = await List.findOne({ _id: moveCardsTo, boardId: list.boardId });

    if (!target || String(target._id) === String(list._id)) {
      throw new HttpError(
        400,
        "LIST_NOT_ON_BOARD",
        "Cards can only be moved to another list on the same board",
      );
    }

    const targetCount = await Card.countDocuments({ list: target._id });

    if (targetCount + cardCount > CARD_LIMIT) {
      throw new HttpError(409, "CARD_LIMIT", "A list cannot have more than 200 cards");
    }

    const cards = await Card.find({ list: list._id })
      .sort({ position: 1 })
      .select("_id");
    const lastCard = await Card.findOne({ list: target._id })
      .sort({ position: -1 })
      .select("position");
    const start = lastCard?.position ?? 0;

    await Card.bulkWrite(
      cards.map((card, index) => ({
        updateOne: {
          filter: { _id: card._id },
          update: {
            $set: {
              list: target._id,
              position: start + (index + 1) * CARD_POSITION_STEP,
            },
          },
        },
      })),
    );
  }

  await list.deleteOne();

  await logActivity({
    workspace: board.workspaceId,
    board: board._id,
    actor,
    type: "list.deleted",
    meta: { listName: list.name },
  });
}
