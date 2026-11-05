import { Types } from "mongoose";
import { Board, type IBoard } from "../models/Board";
import { Card } from "../models/Card";
import { Comment } from "../models/Comment";
import { List, type ListDocument } from "../models/List";
import { User } from "../models/User";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { LIMITS } from "../constants/limits";
import { HttpError } from "../utils/HttpError";
import { todayString } from "../utils/dates";
import {
  requireBoardAccess,
  requireOwner,
  requireWorkspaceMember,
  type Actor,
} from "./access.service";
import { listBoardActivity, logActivity } from "./activity.service";
import { toCardDto } from "./card.dto";
import type { CreateBoardBody, UpdateBoardBody } from "../schemas/board.schema";

export type BoardDto = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
};

type ListDto = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isDone: boolean;
};

const toBoardDto = (board: IBoard): BoardDto => ({
  id: String(board._id),
  workspaceId: String(board.workspace),
  name: board.name,
  description: board.description ?? null,
  createdAt: board.createdAt.toISOString(),
});

const toListDto = (list: ListDocument): ListDto => ({
  id: String(list._id),
  boardId: String(list.boardId),
  name: list.name,
  position: list.position,
  isDone: list.isDone,
});

const DEFAULT_LISTS = [
  { name: "To do", position: 1024, isDone: false },
  { name: "Doing", position: 2048, isDone: false },
  { name: "Done", position: 3072, isDone: true },
];

export async function createBoard(
  workspaceId: string,
  actor: Actor,
  input: CreateBoardBody
): Promise<BoardDto> {
  await requireWorkspaceMember(workspaceId, actor.id);

  const count = await Board.countDocuments({ workspace: workspaceId });
  if (count >= LIMITS.BOARDS_PER_WORKSPACE) {
    throw new HttpError(
      409,
      "BOARD_LIMIT",
      `A workspace can have at most ${LIMITS.BOARDS_PER_WORKSPACE} boards`
    );
  }

  const board = await Board.create({
    workspace: workspaceId,
    name: input.name,
    description: input.description || null,
    createdBy: actor.id,
  });

  try {
    await List.insertMany(
      DEFAULT_LISTS.map((list) => ({ ...list, boardId: board._id }))
    );
  } catch (error) {
    await List.deleteMany({ boardId: board._id });
    await Board.deleteOne({ _id: board._id });
    throw error;
  }

  await logActivity({
    workspace: board.workspace,
    board: board._id,
    actor,
    type: "board.created",
    meta: { boardName: board.name },
  });

  return toBoardDto(board);
}

export type BoardSummaryDto = BoardDto & { listCount: number; cardCount: number };

type CountRow = { _id: Types.ObjectId; count: number };

export async function listBoards(
  workspaceId: string,
  userId: string
): Promise<BoardSummaryDto[]> {
  await requireWorkspaceMember(workspaceId, userId);

  const boards = await Board.find({ workspace: workspaceId }).sort({ createdAt: -1 });
  const ids = boards.map((board) => board._id);

  const countBy = (rows: CountRow[]) =>
    new Map(rows.map((row) => [String(row._id), row.count]));

  const [listRows, cardRows] = await Promise.all([
    List.aggregate<CountRow>([
      { $match: { boardId: { $in: ids } } },
      { $group: { _id: "$boardId", count: { $sum: 1 } } },
    ]),
    Card.aggregate<CountRow>([
      { $match: { board: { $in: ids } } },
      { $group: { _id: "$board", count: { $sum: 1 } } },
    ]),
  ]);

  const lists = countBy(listRows);
  const cards = countBy(cardRows);

  return boards.map((board) => ({
    ...toBoardDto(board),
    listCount: lists.get(String(board._id)) ?? 0,
    cardCount: cards.get(String(board._id)) ?? 0,
  }));
}

export async function getBoardView(boardId: string, userId: string) {
  const { board, access } = await requireBoardAccess(boardId, userId);

  const [lists, cards, memberships] = await Promise.all([
    List.find({ boardId: board._id }).sort({ position: 1 }),
    Card.find({ board: board._id }),
    WorkspaceMember.find({ workspaceId: board.workspace })
      .sort({ joinedAt: 1 })
      .select("userId")
      .lean<{ userId: Types.ObjectId }[]>(),
  ]);

  const memberIds = memberships.map((membership) => String(membership.userId));
  const creatorIds = [...new Set(cards.map((card) => String(card.createdBy)))].filter(
    (id) => !memberIds.includes(id)
  );
  const users = await User.find({ _id: { $in: [...memberIds, ...creatorIds] } }).select("name");
  const people = new Map(users.map((user) => [String(user._id), user.name]));

  const listOrder = new Map(lists.map((list, index) => [String(list._id), index]));
  cards.sort(
    (a, b) =>
      (listOrder.get(String(a.list)) ?? 0) - (listOrder.get(String(b.list)) ?? 0) ||
      a.position - b.position
  );

  const context = {
    people,
    doneListIds: new Set(
      lists.filter((list) => list.isDone).map((list) => String(list._id))
    ),
    today: todayString(),
  };

  return {
    board: toBoardDto(board),
    role: access.role,
    members: memberIds
      .filter((id) => people.has(id))
      .map((id) => ({ id, name: people.get(id) as string })),
    lists: lists.map(toListDto),
    cards: cards.map((card) => toCardDto(card, context)),
  };
}

export async function updateBoard(
  boardId: string,
  actor: Actor,
  input: UpdateBoardBody
): Promise<BoardDto> {
  const { board } = await requireBoardAccess(boardId, actor.id);
  const previousName = board.name;

  if (input.name !== undefined) board.name = input.name;
  if (input.description !== undefined) board.description = input.description || null;
  await board.save();

  if (input.name !== undefined && input.name !== previousName) {
    await logActivity({
      workspace: board.workspace,
      board: board._id,
      actor,
      type: "board.renamed",
      meta: { from: previousName, to: board.name },
    });
  }

  return toBoardDto(board);
}

export async function deleteBoard(boardId: string, actor: Actor): Promise<void> {
  const { board, access } = await requireBoardAccess(boardId, actor.id);
  requireOwner(access);

  await Comment.deleteMany({ board: board._id });
  await Card.deleteMany({ board: board._id });
  await List.deleteMany({ boardId: board._id });
  await board.deleteOne();

  await logActivity({
    workspace: board.workspace,
    board: null,
    actor,
    type: "board.deleted",
    meta: { boardName: board.name },
  });
}

export async function getBoardActivity(
  boardId: string,
  userId: string,
  options: { limit?: number; before?: string } = {}
) {
  await requireBoardAccess(boardId, userId);
  return listBoardActivity(boardId, options);
}
