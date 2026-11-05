import type { Request, Response } from "express";
import {
  addWorkspaceMember,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../services/workspaceMember.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { serializeUser, serializeWorkspaceMember } from "../utils/serialize";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const members = await listWorkspaceMembers(
    String(req.params.workspaceId),
    currentUserId(req),
  );

  res.json({
    data: members.map(({ membership, user }) => ({
      ...serializeWorkspaceMember(membership),
      user: user ? serializeUser(user) : null,
    })),
  });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const membership = await addWorkspaceMember(
    String(req.params.workspaceId),
    currentUserId(req),
    req.body,
  );

  res.status(201).json({ data: serializeWorkspaceMember(membership) });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const membership = await updateWorkspaceMemberRole(
    String(req.params.workspaceId),
    currentUserId(req),
    String(req.params.userId),
    req.body.role,
  );

  res.json({ data: serializeWorkspaceMember(membership) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await removeWorkspaceMember(
    String(req.params.workspaceId),
    currentUserId(req),
    String(req.params.userId),
  );

  res.status(204).send();
});
