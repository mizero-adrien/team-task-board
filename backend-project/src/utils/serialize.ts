import type { IInvite } from "../models/Invite";
import type { IUser } from "../models/User";
import type { IWorkspace } from "../models/Workspace";
import type { IWorkspaceMember } from "../models/WorkspaceMember";

export function serializeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    blocked: user.blocked,
    blockReason: user.blockReason ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeWorkspace(workspace: IWorkspace) {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    description: workspace.description ?? null,
    ownerId: workspace.ownerId.toString(),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

export function serializeWorkspaceMember(member: IWorkspaceMember) {
  return {
    id: member._id.toString(),
    workspaceId: member.workspaceId.toString(),
    userId: member.userId.toString(),
    role: member.role,
    joinedAt: member.joinedAt,
  };
}

export function serializeInvite(invite: IInvite) {
  return {
    id: invite._id.toString(),
    workspaceId: invite.workspaceId.toString(),
    email: invite.email ?? null,
    maxUses: invite.maxUses,
    usesCount: invite.usesCount,
    expiresAt: invite.expiresAt,
    revokedAt: invite.revokedAt ?? null,
    invitedBy: invite.invitedBy ? invite.invitedBy.toString() : null,
    createdAt: invite.createdAt,
    updatedAt: invite.updatedAt,
  };
}
