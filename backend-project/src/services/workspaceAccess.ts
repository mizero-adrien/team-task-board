import { WorkspaceMember, type IWorkspaceMember } from "../models/WorkspaceMember";
import { ApiError } from "../utils/ApiError";

export async function getWorkspaceMembership(
  workspaceId: string,
  userId: string,
): Promise<IWorkspaceMember> {
  const membership = await WorkspaceMember.findOne({ workspaceId, userId });

  if (!membership) {
    throw ApiError.notFound("Workspace not found or you are not a member");
  }

  return membership;
}

export async function assertWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<IWorkspaceMember> {
  return getWorkspaceMembership(workspaceId, userId);
}

export async function assertWorkspaceOwner(
  workspaceId: string,
  userId: string,
): Promise<IWorkspaceMember> {
  const membership = await getWorkspaceMembership(workspaceId, userId);

  if (membership.role !== "owner") {
    throw ApiError.forbidden("Only workspace owners can perform this action");
  }

  return membership;
}
