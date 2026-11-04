import { Types } from "mongoose";
import { Card, type ICard } from "../models/Card";
import { Comment } from "../models/Comment";
import { List } from "../models/List";
import { Board } from "../models/Board";
import { Workspace } from "../models/Workspace";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { User } from "../models/User";
import { HttpError } from "../utils/HttpError";
import { todayString } from "../utils/dates";
import type {
  BulkCardsInput,
  CreateCardInput,
  MoveCardInput,
  UpdateCardInput,
} from "../schemas/card.schema";

const CARD_POSITION_STEP = 1024;
const CARD_LIMIT = 200;

export type Actor = { id: string; name: string };
export type Person = { id: string; name: string };

export type CardResponse = {
  id: string;
  boardId: string;
  listId: string;
  workspaceId: string;
  title: string;
  description: string;
  dueDate: string | null;
  isOverdue: boolean;
  assignee: Person | null;
  position: number;
  createdBy: Person;
  createdVia: ICard["createdVia"];
  createdAt: Date;
  updatedAt: Date;
};

export type MyCardResponse = {
  id: string;
  title: string;
  dueDate: string | null;
  isOverdue: boolean;
  listName: string;
  boardId: string;
  boardName: string;
  workspaceId: string;
  workspaceName: string;
};

async function personFor(userId: Types.ObjectId | string): Promise<Person> {
  const user = await User.findById(userId).select("name").lean();

  return { id: String(userId), name: user?.name ?? "Unknown user" };
}

async function assertMember(
  workspaceId: Types.ObjectId,
  userId: string,
  message: string
): Promise<void> {
  const membership = await WorkspaceMember.exists({ workspaceId, userId });

  if (!membership) {
    // 404, not 403, so a non-member cannot confirm that the resource exists.
    throw new HttpError(404, "NOT_FOUND", message);
  }
}

async function loadCardForMember(cardId: string, userId: string): Promise<ICard> {
  const card = await Card.findById(cardId);

  if (!card) {
    throw new HttpError(404, "NOT_FOUND", "Card not found");
  }

  await assertMember(card.workspace, userId, "Card not found");

  return card;
}

async function loadListAndBoardForMember(listId: string, userId: string) {
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

async function resolveAssignee(
  workspaceId: Types.ObjectId,
  assigneeId: string
): Promise<Person> {
  const membership = await WorkspaceMember.exists({ workspaceId, userId: assigneeId });

  if (!membership) {
    throw new HttpError(
      400,
      "ASSIGNEE_NOT_MEMBER",
      "The assignee is not a member of this workspace"
    );
  }

  const user = await User.findById(assigneeId).select("name");

  if (!user) {
    throw new HttpError(
      400,
      "ASSIGNEE_NOT_MEMBER",
      "The assignee is not a member of this workspace"
    );
  }

  return { id: String(user._id), name: user.name };
}

function isOverdue(dueDate: string | null, listIsDone: boolean): boolean {
  return dueDate !== null && dueDate < todayString() && !listIsDone;
}

function toCardResponse(
  card: ICard,
  list: { isDone: boolean },
  assignee: Person | null,
  createdBy: Person
): CardResponse {
  return {
    id: String(card._id),
    boardId: String(card.board),
    listId: String(card.list),
    workspaceId: String(card.workspace),
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    isOverdue: isOverdue(card.dueDate, list.isDone),
    assignee,
    position: card.position,
    createdBy,
    createdVia: card.createdVia,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export async function createCard(
  listId: string,
  actor: Actor,
  input: CreateCardInput
): Promise<CardResponse> {
  const { list, board } = await loadListAndBoardForMember(listId, actor.id);

  const cardCount = await Card.countDocuments({ list: list._id });

  if (cardCount >= CARD_LIMIT) {
    throw new HttpError(409, "CARD_LIMIT", "This list already has 200 cards");
  }

  const assignee = input.assigneeId
    ? await resolveAssignee(board.workspaceId, input.assigneeId)
    : null;

  const lastCard = await Card.findOne({ list: list._id })
    .sort({ position: -1 })
    .select("position")
    .lean();

  const position = lastCard ? lastCard.position + CARD_POSITION_STEP : CARD_POSITION_STEP;

  const card = await Card.create({
    board: board._id,
    list: list._id,
    workspace: board.workspaceId,
    title: input.title,
    description: input.description ?? "",
    dueDate: input.dueDate ?? null,
    assignee: assignee ? new Types.ObjectId(assignee.id) : null,
    position,
    createdBy: new Types.ObjectId(actor.id),
    createdVia: "manual",
    aiBatchId: null,
  });

  return toCardResponse(card, list, assignee, { id: actor.id, name: actor.name });
}

export async function getCard(cardId: string, actor: Actor) {
  const card = await loadCardForMember(cardId, actor.id);

  const [list, board, assignee, createdBy] = await Promise.all([
    List.findById(card.list),
    Board.findById(card.board),
    card.assignee ? personFor(card.assignee) : Promise.resolve(null),
    personFor(card.createdBy),
  ]);

  if (!list || !board) {
    throw new HttpError(404, "NOT_FOUND", "Card not found");
  }

  return {
    ...toCardResponse(card, list, assignee, createdBy),
    boardName: board.name,
    listName: list.name,
  };
}

export async function updateCard(
  cardId: string,
  actor: Actor,
  input: UpdateCardInput
): Promise<CardResponse> {
  const card = await loadCardForMember(cardId, actor.id);
  const list = await List.findById(card.list);

  if (!list) {
    throw new HttpError(404, "NOT_FOUND", "Card not found");
  }

  let assignee: Person | null;

  if (input.assigneeId !== undefined) {
    if (input.assigneeId === null) {
      card.assignee = null;
      assignee = null;
    } else {
      assignee = await resolveAssignee(card.workspace, input.assigneeId);
      card.assignee = new Types.ObjectId(input.assigneeId);
    }
  } else {
    assignee = card.assignee ? await personFor(card.assignee) : null;
  }

  if (input.title !== undefined) card.title = input.title;
  if (input.description !== undefined) card.description = input.description;
  if (input.dueDate !== undefined) card.dueDate = input.dueDate;

  await card.save();

  const createdBy = await personFor(card.createdBy);

  return toCardResponse(card, list, assignee, createdBy);
}

export async function moveCard(
  cardId: string,
  actor: Actor,
  input: MoveCardInput
): Promise<CardResponse> {
  const card = await loadCardForMember(cardId, actor.id);
  const targetList = await List.findById(input.listId);

  if (!targetList || String(targetList.boardId) !== String(card.board)) {
    throw new HttpError(
      400,
      "LIST_NOT_ON_BOARD",
      "The target list is not on this card's board"
    );
  }

  let position: number;

  if (input.afterCardId === undefined) {
    const lastCard = await Card.findOne({ list: targetList._id, _id: { $ne: card._id } })
      .sort({ position: -1 })
      .select("position")
      .lean();

    position = lastCard ? lastCard.position + CARD_POSITION_STEP : CARD_POSITION_STEP;
  } else if (input.afterCardId === null) {
    const firstCard = await Card.findOne({ list: targetList._id, _id: { $ne: card._id } })
      .sort({ position: 1 })
      .select("position")
      .lean();

    position = firstCard ? firstCard.position - CARD_POSITION_STEP : CARD_POSITION_STEP;
  } else {
    const afterCard = await Card.findOne({
      _id: input.afterCardId,
      list: targetList._id,
    });

    if (!afterCard) {
      throw new HttpError(
        400,
        "BAD_REQUEST",
        "The card to place after is not in the target list"
      );
    }

    if (String(afterCard._id) === String(card._id)) {
      throw new HttpError(400, "BAD_REQUEST", "A card cannot be placed after itself");
    }

    const nextCard = await Card.findOne({
      list: targetList._id,
      _id: { $ne: card._id },
      position: { $gt: afterCard.position },
    })
      .sort({ position: 1 })
      .select("position")
      .lean();

    position = nextCard
      ? (afterCard.position + nextCard.position) / 2
      : afterCard.position + CARD_POSITION_STEP;
  }

  card.list = targetList._id;
  card.position = position;
  await card.save();

  const [assignee, createdBy] = await Promise.all([
    card.assignee ? personFor(card.assignee) : Promise.resolve(null),
    personFor(card.createdBy),
  ]);

  return toCardResponse(card, targetList, assignee, createdBy);
}

export async function deleteCard(cardId: string, actor: Actor): Promise<void> {
  const card = await loadCardForMember(cardId, actor.id);

  await Comment.deleteMany({ card: card._id });
  await Card.deleteOne({ _id: card._id });
}

export async function bulkCreateCards(
  boardId: string,
  actor: Actor,
  input: BulkCardsInput
): Promise<{ cards: CardResponse[] }> {
  const board = await Board.findById(boardId);

  if (!board) {
    throw new HttpError(404, "NOT_FOUND", "Board not found");
  }

  await assertMember(board.workspaceId, actor.id, "Board not found");

  const alreadyAdded = await Card.exists({ board: board._id, aiBatchId: input.batchId });

  if (alreadyAdded) {
    throw new HttpError(
      409,
      "BATCH_ALREADY_ADDED",
      "These cards have already been added"
    );
  }

  const listIds = [...new Set(input.cards.map((card) => card.listId))];
  const lists = await List.find({ _id: { $in: listIds }, boardId: board._id });
  const listMap = new Map(lists.map((list) => [String(list._id), list]));

  const missingLists = input.cards.flatMap((card, index) =>
    listMap.has(card.listId)
      ? []
      : [{ field: `cards.${index}.listId`, message: "List is not on this board" }]
  );

  if (missingLists.length > 0) {
    throw new HttpError(
      400,
      "LIST_NOT_ON_BOARD",
      "Every card must use a list on this board",
      { errors: missingLists }
    );
  }

  const newCounts = new Map<string, number>();
  for (const card of input.cards) {
    newCounts.set(card.listId, (newCounts.get(card.listId) ?? 0) + 1);
  }

  const existingCounts = await Promise.all(
    listIds.map(async (listId) => ({
      listId,
      count: await Card.countDocuments({ list: listId }),
    }))
  );

  for (const { listId, count } of existingCounts) {
    if (count + (newCounts.get(listId) ?? 0) > CARD_LIMIT) {
      throw new HttpError(409, "CARD_LIMIT", "A list cannot have more than 200 cards");
    }
  }

  const nextPositions = new Map<string, number>();

  for (const listId of listIds) {
    const lastCard = await Card.findOne({ list: listId })
      .sort({ position: -1 })
      .select("position")
      .lean();

    nextPositions.set(
      listId,
      lastCard ? lastCard.position + CARD_POSITION_STEP : CARD_POSITION_STEP
    );
  }

  const docs = input.cards.map((item) => {
    const list = listMap.get(item.listId);
    const position = nextPositions.get(item.listId) ?? CARD_POSITION_STEP;

    nextPositions.set(item.listId, position + CARD_POSITION_STEP);

    return new Card({
      board: board._id,
      list: list?._id,
      workspace: board.workspaceId,
      title: item.title,
      description: item.description ?? "",
      dueDate: item.dueDate ?? null,
      assignee: null,
      position,
      createdBy: new Types.ObjectId(actor.id),
      createdVia: "ai",
      aiBatchId: input.batchId,
    });
  });

  for (const [index, doc] of docs.entries()) {
    try {
      await doc.validate();
    } catch (error) {
      const validationError = error as {
        name?: string;
        errors?: Record<string, { message?: string }>;
      };

      if (validationError.name === "ValidationError" && validationError.errors) {
        throw new HttpError(400, "VALIDATION_FAILED", "Validation failed", {
          errors: Object.entries(validationError.errors).map(([field, detail]) => ({
            field: `cards.${index}.${field}`,
            message: detail.message ?? "Invalid value",
          })),
        });
      }

      throw error;
    }
  }

  const created = await Card.insertMany(docs);
  const createdBy = { id: actor.id, name: actor.name };

  return {
    cards: created.map((card) =>
      toCardResponse(card, listMap.get(String(card.list))!, null, createdBy)
    ),
  };
}

export async function listMyCards(
  actor: Actor,
  workspaceId?: string
): Promise<MyCardResponse[]> {
  const memberships = await WorkspaceMember.find({ userId: actor.id })
    .select("workspaceId")
    .lean();

  const allowedWorkspaceIds = memberships.map((membership) =>
    String(membership.workspaceId)
  );

  if (workspaceId && !allowedWorkspaceIds.includes(workspaceId)) {
    return [];
  }

  const workspaceIds = workspaceId
    ? [new Types.ObjectId(workspaceId)]
    : memberships.map((membership) => membership.workspaceId);

  const cards = await Card.find({
    assignee: new Types.ObjectId(actor.id),
    workspace: { $in: workspaceIds },
  }).lean();

  if (cards.length === 0) return [];

  const listIds = [...new Set(cards.map((card) => String(card.list)))];
  const boardIds = [...new Set(cards.map((card) => String(card.board)))];
  const cardWorkspaceIds = [...new Set(cards.map((card) => String(card.workspace)))];

  const [lists, boards, workspaces] = await Promise.all([
    List.find({ _id: { $in: listIds } }).lean(),
    Board.find({ _id: { $in: boardIds } }).lean(),
    Workspace.find({ _id: { $in: cardWorkspaceIds } }).lean(),
  ]);

  const listMap = new Map(lists.map((list) => [String(list._id), list]));
  const boardMap = new Map(boards.map((board) => [String(board._id), board]));
  const workspaceMap = new Map(
    workspaces.map((workspace) => [String(workspace._id), workspace])
  );

  const today = todayString();

  return cards
    .sort((first, second) => {
      if (first.dueDate === null && second.dueDate === null) return 0;
      if (first.dueDate === null) return 1;
      if (second.dueDate === null) return -1;
      return first.dueDate.localeCompare(second.dueDate);
    })
    .map((card) => {
      const list = listMap.get(String(card.list));
      const board = boardMap.get(String(card.board));
      const workspace = workspaceMap.get(String(card.workspace));

      return {
        id: String(card._id),
        title: card.title,
        dueDate: card.dueDate,
        isOverdue: card.dueDate !== null && card.dueDate < today && !(list?.isDone ?? false),
        listName: list?.name ?? "",
        boardId: String(card.board),
        boardName: board?.name ?? "",
        workspaceId: String(card.workspace),
        workspaceName: workspace?.name ?? "",
      };
    });
}
