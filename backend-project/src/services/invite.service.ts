import { createHash, randomBytes } from "node:crypto";
import { Invite, type IInvite } from "../models/Invite";
import { User } from "../models/User";
import { Workspace } from "../models/Workspace";
import { WorkspaceMember, type IWorkspaceMember } from "../models/WorkspaceMember";
import { ApiError } from "../utils/ApiError";
import { assertWorkspaceOwner } from "./workspaceAccess";

interface CreateInviteInput {
  email?: string | null;
  maxUses: number;
  expiresInHours: number;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isInviteUsable(invite: IInvite): boolean {
  return !invite.revokedAt && invite.expiresAt.getTime() > Date.now() && invite.usesCount < invite.maxUses;
}

export async function createInvite(
  workspaceId: string,
  requesterId: string,
  input: CreateInviteInput,
): Promise<{ invite: IInvite; token: string }> {
  await assertWorkspaceOwner(workspaceId, requesterId);

  const token = randomBytes(32).toString("hex");
  const invite = await Invite.create({
    workspaceId,
    email: input.email ?? null,
    tokenHash: hashToken(token),
    maxUses: input.maxUses,
    usesCount: 0,
    expiresAt: new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000),
    invitedBy: requesterId,
  });

  return { invite, token };
}

export async function listWorkspaceInvites(
  workspaceId: string,
  requesterId: string,
): Promise<IInvite[]> {
  await assertWorkspaceOwner(workspaceId, requesterId);

  return Invite.find({ workspaceId }).sort({ createdAt: -1 });
}

export async function revokeInvite(
  inviteId: string,
  requesterId: string,
): Promise<IInvite> {
  const invite = await Invite.findById(inviteId);

  if (!invite) {
    throw ApiError.notFound("Invite not found");
  }

  await assertWorkspaceOwner(invite.workspaceId.toString(), requesterId);

  if (invite.revokedAt) {
    throw ApiError.conflict("Invite has already been revoked");
  }

  invite.revokedAt = new Date();
  await invite.save();

  return invite;
}

export async function previewInvite(
  token: string,
): Promise<{ invite: IInvite; workspaceName: string }> {
  const invite = await Invite.findOne({ tokenHash: hashToken(token) });

  if (!invite) {
    throw ApiError.notFound("Invite not found");
  }

  if (invite.revokedAt) {
    throw ApiError.gone("Invite has been revoked");
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    throw ApiError.gone("Invite has expired");
  }

  if (invite.usesCount >= invite.maxUses) {
    throw ApiError.gone("Invite has already been used");
  }

  const workspace = await Workspace.findById(invite.workspaceId).select("name");

  if (!workspace) {
    throw ApiError.notFound("Workspace not found");
  }

  return { invite, workspaceName: workspace.name };
}

export async function acceptInvite(
  token: string,
  userId: string,
): Promise<{ invite: IInvite; membership: IWorkspaceMember }> {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  const invite = await Invite.findOne({ tokenHash: hashToken(token) });

  if (!invite) {
    throw ApiError.notFound("Invite not found");
  }

  if (!isInviteUsable(invite)) {
    throw ApiError.gone("Invite is no longer usable");
  }

  if (invite.email && invite.email !== user.email.toLowerCase()) {
    throw ApiError.forbidden("This invite was issued for a different email address");
  }

  const existingMembership = await WorkspaceMember.findOne({
    workspaceId: invite.workspaceId,
    userId: user._id,
  });

  if (existingMembership) {
    throw ApiError.conflict("You are already a member of this workspace");
  }

  const claimedInvite = await Invite.findOneAndUpdate(
    {
      _id: invite._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$usesCount", "$maxUses"] },
    },
    { $inc: { usesCount: 1 } },
    { new: true },
  );

  if (!claimedInvite) {
    throw ApiError.gone("Invite is no longer usable");
  }

  try {
    const membership = await WorkspaceMember.create({
      workspaceId: claimedInvite.workspaceId,
      userId: user._id,
      role: "member",
    });

    return { invite: claimedInvite, membership };
  } catch (error) {
    await Invite.updateOne({ _id: claimedInvite._id }, { $inc: { usesCount: -1 } });
    throw error;
  }
}
