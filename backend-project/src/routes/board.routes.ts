import { Router } from "express";
import * as boards from "../controllers/board.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import { createBoardSchema, updateBoardSchema } from "../schemas/board.schema";

const router = Router();

router.post(
  "/workspaces/:workspaceId/boards",
  protect,
  validateIdParam("workspaceId"),
  validateBody(createBoardSchema),
  boards.createBoard
);
router.get(
  "/workspaces/:workspaceId/boards",
  protect,
  validateIdParam("workspaceId"),
  boards.listBoards
);
router.get("/boards/:boardId", protect, validateIdParam("boardId"), boards.getBoard);
router.patch(
  "/boards/:boardId",
  protect,
  validateIdParam("boardId"),
  validateBody(updateBoardSchema),
  boards.updateBoard
);
router.delete(
  "/boards/:boardId",
  protect,
  validateIdParam("boardId"),
  boards.deleteBoard
);
router.get(
  "/boards/:boardId/activity",
  protect,
  validateIdParam("boardId"),
  boards.getActivity
);

export default router;
