import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import {
  bulkCreate,
  create,
  get,
  mine,
  move,
  remove,
  update,
} from "../controllers/card.controller";
import {
  bulkCardsSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from "../schemas/card.schema";

const router = Router();

router.use(protect);

router.post(
  "/lists/:listId/cards",
  validateIdParam("listId"),
  validateBody(createCardSchema),
  create
);

// Must stay above "/cards/:cardId", or "mine" is read as a card id.
router.get("/cards/mine", mine);

router.get("/cards/:cardId", validateIdParam("cardId"), get);

router.patch(
  "/cards/:cardId",
  validateIdParam("cardId"),
  validateBody(updateCardSchema),
  update
);

router.post(
  "/cards/:cardId/move",
  validateIdParam("cardId"),
  validateBody(moveCardSchema),
  move
);

router.delete("/cards/:cardId", validateIdParam("cardId"), remove);

router.post(
  "/boards/:boardId/cards/bulk",
  validateIdParam("boardId"),
  validateBody(bulkCardsSchema),
  bulkCreate
);

export default router;
