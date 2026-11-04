import type { Request, Response } from "express";
import {
  acceptInvite,
  createInvite,
  listWorkspaceInvites,
  previewInvite,
  revokeInvite,
} from "../services/invite.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { serializeInvite, serializeWorkspaceMember } from "../utils/serialize";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return req.user.id;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { invite, token } = await createInvite(
    String(req.params.workspaceId),
    currentUserId(req),
    req.body,
  );

  res.status(201).json({
    data: {
      ...serializeInvite(invite),
      token,
    },
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const invites = await listWorkspaceInvites(
    String(req.params.workspaceId),
    currentUserId(req),
  );

  res.json({ data: invites.map(serializeInvite) });
});

export const revoke = asyncHandler(async (req: Request, res: Response) => {
  const invite = await revokeInvite(String(req.params.inviteId), currentUserId(req));
  res.json({ data: serializeInvite(invite) });
});

export const preview = asyncHandler(async (req: Request, res: Response) => {
  const { invite, workspaceName } = await previewInvite(req.body.token);

  res.json({
    data: {
      workspaceName,
      email: invite.email ?? null,
      maxUses: invite.maxUses,
      usesCount: invite.usesCount,
      expiresAt: invite.expiresAt,
    },
  });
});

export const accept = asyncHandler(async (req: Request, res: Response) => {
  const { invite, membership } = await acceptInvite(req.body.token, currentUserId(req));

  res.status(201).json({
    data: {
      invite: serializeInvite(invite),
      membership: serializeWorkspaceMember(membership),
    },
  });
});
