import { Board, type IBoard } from "../models/Board";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { HttpError } from "../utils/HttpError";

export type WorkspaceRole = "owner" | "member";
export type Actor = { id: string; name: string };
export type Access = { workspaceId: string; role: WorkspaceRole };

const notFound = (what: string) => new HttpError(404, "NOT_FOUND", `${what} not found`);

async function roleOf(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
  const membership = await WorkspaceMember.findOne({ workspaceId, userId })
    .select("role")
    .lean<{ role: WorkspaceRole }>();

  return membership?.role ?? null;
}

export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<Access> {
  const role = await roleOf(workspaceId, userId);
  if (!role) throw notFound("Workspace");
  return { workspaceId, role };
}

export async function requireBoardAccess(
  boardId: string,
  userId: string
): Promise<{ board: IBoard; access: Access }> {
  const board = await Board.findById(boardId);
  if (!board) throw notFound("Board");

  const workspaceId = String(board.workspace);
  const role = await roleOf(workspaceId, userId);
  if (!role) throw notFound("Board");

  return { board, access: { workspaceId, role } };
}

export function requireOwner(access: Access): void {
  if (access.role !== "owner") {
    throw new HttpError(403, "FORBIDDEN", "Only the workspace owner can do this");
  }
}
