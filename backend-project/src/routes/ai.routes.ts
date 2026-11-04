import { Router } from "express";
import { breakdown, usage } from "../controllers/ai.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import { breakdownSchema } from "../schemas/ai.schema";

const router = Router();

// Full paths, because both live under different prefixes (/boards and /ai)
router.post(
  "/boards/:boardId/ai/breakdown",
  protect,
  validateIdParam("boardId"),
  validateBody(breakdownSchema),
  breakdown
);
router.get("/ai/usage", protect, usage);

export default router;
