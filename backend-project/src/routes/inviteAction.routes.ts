import { Router } from "express";
import { accept, preview } from "../controllers/invite.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { acceptInviteSchema, previewInviteSchema } from "../validators/invite.validator";

const router = Router();

router.post("/preview", validateBody(previewInviteSchema), preview);
router.post("/accept", protect, validateBody(acceptInviteSchema), accept);

export default router;
