import { asyncHandler } from "../utils/asyncHandler";
import { requireUser } from "../utils/requireUser";
import {
  blockAdminUser,
  createAdminUser,
  createAdminWorkspace,
  deleteAdminUser,
  deleteAdminWorkspace,
  getAdminStats,
  listAdminUsers,
  listAdminWorkspaces,
  unblockAdminUser,
  updateAdminUser,
  updateAdminWorkspace,
} from "../services/admin.service";
import type {
  AdminUserListQuery,
  AdminWorkspaceListQuery,
  BlockUserInput,
  CreateAdminUserInput,
  CreateAdminWorkspaceInput,
  UpdateAdminUserInput,
  UpdateAdminWorkspaceInput,
} from "../validators/admin.validator";

export const stats = asyncHandler(async (_req, res) => {
  res.json(await getAdminStats());
});

export const users = asyncHandler(async (_req, res) => {
  res.json(await listAdminUsers(res.locals.query as AdminUserListQuery));
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await createAdminUser(req.body as CreateAdminUserInput);
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const admin = requireUser(req);
  const user = await updateAdminUser(
    String(req.params.userId),
    admin.id,
    req.body as UpdateAdminUserInput,
  );
  res.json(user);
});

export const blockUser = asyncHandler(async (req, res) => {
  const admin = requireUser(req);
  const user = await blockAdminUser(
    String(req.params.userId),
    admin.id,
    req.body as BlockUserInput,
  );
  res.json(user);
});

export const unblockUser = asyncHandler(async (req, res) => {
  const user = await unblockAdminUser(String(req.params.userId));
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const admin = requireUser(req);
  await deleteAdminUser(String(req.params.userId), admin.id);
  res.status(204).send();
});

export const workspaces = asyncHandler(async (_req, res) => {
  res.json(await listAdminWorkspaces(res.locals.query as AdminWorkspaceListQuery));
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await createAdminWorkspace(req.body as CreateAdminWorkspaceInput);
  res.status(201).json(workspace);
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await updateAdminWorkspace(
    String(req.params.workspaceId),
    req.body as UpdateAdminWorkspaceInput,
  );
  res.json(workspace);
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  await deleteAdminWorkspace(String(req.params.workspaceId));
  res.status(204).send();
});
