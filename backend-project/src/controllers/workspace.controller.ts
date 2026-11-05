import type { Request, Response } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspacesForUser,
  updateWorkspace,
} from "../services/workspace.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { serializeWorkspace } from "../utils/serialize";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return req.user.id;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await createWorkspace(currentUserId(req), req.body);
  res.status(201).json({ data: serializeWorkspace(workspace) });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listWorkspacesForUser(
    currentUserId(req),
    req.query as unknown as { page: number; limit: number },
  );

  res.json({
    data: result.items.map(serializeWorkspace),
    pagination: result.pagination,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await getWorkspace(String(req.params.workspaceId), currentUserId(req));
  res.json({ data: serializeWorkspace(workspace) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await updateWorkspace(
    String(req.params.workspaceId),
    currentUserId(req),
    req.body,
  );

  res.json({ data: serializeWorkspace(workspace) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteWorkspace(String(req.params.workspaceId), currentUserId(req));
  res.status(204).send();
});
