import { User, type IUser } from "../models/User";
import { Workspace } from "../models/Workspace";
import { WorkspaceMember, type IWorkspaceMember } from "../models/WorkspaceMember";
import { ApiError } from "../utils/ApiError";
import { assertWorkspaceMember, assertWorkspaceOwner } from "./workspaceAccess";

interface AddMemberInput {
  userId?: string;
  email?: string;
  role: "owner" | "member";
}

export interface MemberWithUser {
  membership: IWorkspaceMember;
  user: IUser | null;
}

export async function listWorkspaceMembers(
  workspaceId: string,
  requesterId: string,
): Promise<MemberWithUser[]> {
  await assertWorkspaceMember(workspaceId, requesterId);

  const memberships = await WorkspaceMember.find({ workspaceId }).sort({ joinedAt: 1 });
  const users = await User.find({
    _id: { $in: memberships.map((membership) => membership.userId) },
  });
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return memberships.map((membership) => ({
    membership,
    user: usersById.get(membership.userId.toString()) ?? null,
  }));
}

export async function addWorkspaceMember(
  workspaceId: string,
  requesterId: string,
  input: AddMemberInput,
): Promise<IWorkspaceMember> {
  await assertWorkspaceOwner(workspaceId, requesterId);

  const user = input.userId
    ? await User.findById(input.userId)
    : await User.findOne({ email: input.email });

  if (!user) {
    throw ApiError.notFound("User to add was not found");
  }

  const existing = await WorkspaceMember.findOne({ workspaceId, userId: user._id });

  if (existing) {
    throw ApiError.conflict("User is already a member of this workspace");
  }

  return WorkspaceMember.create({
    workspaceId,
    userId: user._id,
    role: input.role,
  });
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
  role: "owner" | "member",
): Promise<IWorkspaceMember> {
  await assertWorkspaceOwner(workspaceId, requesterId);

  const membership = await WorkspaceMember.findOne({ workspaceId, userId: targetUserId });

  if (!membership) {
    throw ApiError.notFound("Workspace member not found");
  }

  if (membership.role === "owner" && role === "member") {
    const ownerCount = await WorkspaceMember.countDocuments({ workspaceId, role: "owner" });

    if (ownerCount <= 1) {
      throw ApiError.badRequest("A workspace must have at least one owner");
    }
  }

  membership.role = role;
  await membership.save();

  return membership;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
): Promise<void> {
  const requesterMembership = await assertWorkspaceMember(workspaceId, requesterId);

  if (requesterMembership.role !== "owner" && requesterId !== targetUserId) {
    throw ApiError.forbidden("Only workspace owners can remove other members");
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw ApiError.notFound("Workspace not found");
  }

  if (workspace.ownerId.toString() === targetUserId) {
    throw ApiError.badRequest("The workspace owner cannot be removed");
  }

  const membership = await WorkspaceMember.findOneAndDelete({
    workspaceId,
    userId: targetUserId,
  });

  if (!membership) {
    throw ApiError.notFound("Workspace member not found");
  }
}
