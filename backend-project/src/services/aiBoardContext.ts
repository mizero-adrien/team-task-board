import { Board } from "../models/Board";
import { List } from "../models/List";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { HttpError } from "../utils/HttpError";
import type { ListRef } from "../ai/parseOutput";

export type BoardContext = { boardId: string; workspaceId: string; lists: ListRef[] };

export async function loadBoardContext(boardId: string, userId: string): Promise<BoardContext> {
  const board = await Board.findById(boardId).select("workspace");

  // A missing board and a board the user cannot see give the SAME answer,
  // so nobody can find out which board ids exist.
  const notFound = new HttpError(404, "NOT_FOUND", "Board not found");
  if (!board) throw notFound;

  const member = await WorkspaceMember.exists({ workspaceId: board.workspace, userId });
  if (!member) throw notFound;

  const lists = await List.find({ boardId: board._id }).sort({ position: 1 }).select("name");

  if (lists.length === 0) {
    throw new HttpError(409, "CONFLICT", "This board has no lists yet. Add a list first.");
  }

  return {
    boardId: String(board._id),
    workspaceId: String(board.workspace),
    lists: lists.map((list) => ({ id: String(list._id), name: list.name })),
  };
}
