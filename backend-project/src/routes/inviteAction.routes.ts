import { Router } from "express";
import { accept, preview } from "../controllers/invite.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { acceptInviteSchema, previewInviteSchema } from "../validators/invite.validator";

const router = Router();

router.post("/preview", validate({ body: previewInviteSchema }), preview);
router.post("/accept", authenticate, validate({ body: acceptInviteSchema }), accept);

export default router;
