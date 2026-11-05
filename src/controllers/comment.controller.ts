
import { asyncHandler } from "../utils/AsyncHandler";
import {
  createComment,
  getCardComments,
  deleteComment,
} from "../services/comment.service";
import type { CreateCommentInput } from "../schemas/comment.schema";

// Create a comment
export const create = asyncHandler(async (req, res) => {
  const comment = await createComment(
    req.params.cardId as string,
    req.user!.id,
    req.body as CreateCommentInput
  );

  res.status(201).json(comment);
});

// Get all comments for a card
export const getAll = asyncHandler(async (req, res) => {
  const comments = await getCardComments(
    req.params.cardId as string,
    req.user!.id
  );

  res.json(comments);
});

// Delete a comment
export const remove = asyncHandler(async (req, res) => {
  const result = await deleteComment(
    req.params.commentId as string,
    req.user!.id
  );

  res.json(result);
});
