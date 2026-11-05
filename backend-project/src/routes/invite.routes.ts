import { Router } from "express";
import {
  create,
  list,
  revoke,
} from "../controllers/invite.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import { createInviteSchema } from "../validators/invite.validator";

const router = Router({ mergeParams: true });

router.use(protect);

router.post(
  "/",
  validateIdParam("workspaceId"),
  validateBody(createInviteSchema),
  create,
);
router.get("/", validateIdParam("workspaceId"), list);
router.delete(
  "/:inviteId",
  validateIdParam("workspaceId", "inviteId"),
  revoke,
);

export default router;
