import { Router } from "express";
import {
  create,
  list,
  revoke,
} from "../controllers/invite.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createInviteSchema,
  inviteWorkspaceParamsSchema,
  workspaceInviteParamsSchema,
} from "../validators/invite.validator";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  validate({ params: inviteWorkspaceParamsSchema, body: createInviteSchema }),
  create,
);
router.get("/", validate({ params: inviteWorkspaceParamsSchema }), list);
router.delete(
  "/:inviteId",
  validate({ params: workspaceInviteParamsSchema }),
  revoke,
);

export default router;
