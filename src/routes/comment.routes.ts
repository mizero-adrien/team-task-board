
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import { createCommentSchema } from "../schemas/comment.schema";
import {
  create,
  getAll,
  remove,
} from "../controllers/comment.controller";

const router = Router();

// All comment endpoints require authentication
router.use(protect);

// Create a comment on a card
router.post(
  "/cards/:cardId/comments",
  validateIdParam("cardId"),
  validateBody(createCommentSchema),
  create
);

// Get comments belonging to a card
router.get(
  "/cards/:cardId/comments",
  validateIdParam("cardId"),
  getAll
);

// Delete a comment
router.delete(
  "/comments/:commentId",
  validateIdParam("commentId"),
  remove
);

export default router;
