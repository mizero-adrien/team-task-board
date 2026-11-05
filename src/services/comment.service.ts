
import { Types } from "mongoose";
import { Comment } from "../models/Comment";
import { Card } from "../models/Card";
import { Workspace } from "../models/Workspace";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { HttpError } from "../utils/HttpError";
import type { CreateCommentInput } from "../schemas/comment.schema";

// Check whether a user is a workspace member or owner.
async function ensureWorkspaceMember(
  workspaceId: Types.ObjectId,
  userId: string
) {
  const workspace = await Workspace.findById(workspaceId).select("ownerId");

  if (!workspace) {
    throw new HttpError(404, "NOT_FOUND", "Workspace not found");
  }

  const isOwner = String(workspace.ownerId) === userId;

  if (isOwner) return;

  const member = await WorkspaceMember.findOne({
    workspaceId,
    userId: new Types.ObjectId(userId),
  });

  if (!member) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "You are not a member of this workspace"
    );
  }
}

// Create a comment on a card.
export async function createComment(
  cardId: string,
  userId: string,
  input: CreateCommentInput
) {
  if (!Types.ObjectId.isValid(cardId)) {
    throw new HttpError(400, "VALIDATION_FAILED", "Invalid card ID");
  }

  const card = await Card.findById(cardId);

  if (!card) {
    throw new HttpError(404, "NOT_FOUND", "Card not found");
  }

  await ensureWorkspaceMember(card.workspace, userId);

  return Comment.create({
    card: card._id,
    board: card.board,
    workspace: card.workspace,
    author: new Types.ObjectId(userId),
    text: input.text,
  });
}

// Retrieve comments belonging to a card.
export async function getCardComments(
  cardId: string,
  userId: string
) {
  if (!Types.ObjectId.isValid(cardId)) {
    throw new HttpError(400, "VALIDATION_FAILED", "Invalid card ID");
  }

  const card = await Card.findById(cardId);

  if (!card) {
    throw new HttpError(404, "NOT_FOUND", "Card not found");
  }

  await ensureWorkspaceMember(card.workspace, userId);

  return Comment.find({ card: card._id })
    .populate("author", "name email")
    .sort({ createdAt: 1 });
}

// Delete a comment if the user is its author or workspace owner.
export async function deleteComment(
  commentId: string,
  userId: string
) {
  if (!Types.ObjectId.isValid(commentId)) {
    throw new HttpError(400, "VALIDATION_FAILED", "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new HttpError(404, "NOT_FOUND", "Comment not found");
  }

  const isAuthor = String(comment.author) === userId;

  const workspace = await Workspace.findById(comment.workspace).select("ownerId");

  if (!workspace) {
    throw new HttpError(404, "NOT_FOUND", "Workspace not found");
  }

  const isWorkspaceOwner = String(workspace.ownerId) === userId;

  if (!isAuthor && !isWorkspaceOwner) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "You are not allowed to delete this comment"
    );
  }

  await comment.deleteOne();

  return { message: "Comment deleted successfully" };
}
