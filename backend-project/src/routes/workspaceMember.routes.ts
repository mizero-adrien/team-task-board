import { Router } from "express";
import {
  add,
  list,
  remove,
  updateRole,
} from "../controllers/workspaceMember.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import {
  addMemberSchema,
  updateMemberRoleSchema,
} from "../validators/workspaceMember.validator";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", validateIdParam("workspaceId"), list);
router.post(
  "/",
  validateIdParam("workspaceId"),
  validateBody(addMemberSchema),
  add,
);
router.patch(
  "/:userId",
  validateIdParam("workspaceId", "userId"),
  validateBody(updateMemberRoleSchema),
  updateRole,
);
router.delete(
  "/:userId",
  validateIdParam("workspaceId", "userId"),
  remove,
);

export default router;
