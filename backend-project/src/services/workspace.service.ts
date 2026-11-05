import { Invite } from "../models/Invite";
import { Workspace, type IWorkspace } from "../models/Workspace";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { ApiError } from "../utils/ApiError";
import { assertWorkspaceMember, assertWorkspaceOwner } from "./workspaceAccess";

interface CreateWorkspaceInput {
  name: string;
  description?: string | null;
}

interface UpdateWorkspaceInput {
  name?: string;
  description?: string | null;
}

interface ListWorkspacesInput {
  page?: number | string;
  limit?: number | string;
}

export async function createWorkspace(
  ownerId: string,
  input: CreateWorkspaceInput,
): Promise<IWorkspace> {
  const workspace = await Workspace.create({
    name: input.name,
    description: input.description ?? null,
    ownerId,
  });

  try {
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: ownerId,
      role: "owner",
    });
  } catch (error) {
    await Workspace.findByIdAndDelete(workspace._id);
    throw error;
  }

  return workspace;
}

export async function listWorkspacesForUser(userId: string, input: ListWorkspacesInput) {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(input.limit) || 20));
  const memberships = await WorkspaceMember.find({ userId }).select("workspaceId");
  const workspaceIds = memberships.map((membership) => membership.workspaceId);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Workspace.find({ _id: { $in: workspaceIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Workspace.countDocuments({ _id: { $in: workspaceIds } }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getWorkspace(workspaceId: string, userId: string): Promise<IWorkspace> {
  await assertWorkspaceMember(workspaceId, userId);

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw ApiError.notFound("Workspace not found");
  }

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceInput,
): Promise<IWorkspace> {
  await assertWorkspaceOwner(workspaceId, userId);

  const workspace = await Workspace.findByIdAndUpdate(workspaceId, input, {
    new: true,
    runValidators: true,
  });

  if (!workspace) {
    throw ApiError.notFound("Workspace not found");
  }

  return workspace;
}

export async function deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
  await assertWorkspaceOwner(workspaceId, userId);

  await Promise.all([
    WorkspaceMember.deleteMany({ workspaceId }),
    Invite.deleteMany({ workspaceId }),
  ]);

  const workspace = await Workspace.findByIdAndDelete(workspaceId);

  if (!workspace) {
    throw ApiError.notFound("Workspace not found");
  }
}
