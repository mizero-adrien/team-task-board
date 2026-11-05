import { Router } from "express";
import { create, move, remove, update } from "../controllers/list.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import {
  createListSchema,
  moveListSchema,
  updateListSchema,
} from "../schemas/list.schema";

const router = Router();

router.use(protect);

router.post(
  "/boards/:boardId/lists",
  validateIdParam("boardId"),
  validateBody(createListSchema),
  create,
);

router.patch(
  "/lists/:listId",
  validateIdParam("listId"),
  validateBody(updateListSchema),
  update,
);

router.post(
  "/lists/:listId/move",
  validateIdParam("listId"),
  validateBody(moveListSchema),
  move,
);

router.delete("/lists/:listId", validateIdParam("listId"), remove);

export default router;
