import { Router } from "express";
import {
  add,
  list,
  remove,
  updateRole,
} from "../controllers/workspaceMember.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  addMemberSchema,
  updateMemberRoleSchema,
  workspaceMemberParamsSchema,
} from "../validators/workspaceMember.validator";
import { workspaceIdParamsSchema } from "../validators/workspace.validator";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", validate({ params: workspaceIdParamsSchema }), list);
router.post(
  "/",
  validate({ params: workspaceIdParamsSchema, body: addMemberSchema }),
  add,
);
router.patch(
  "/:userId",
  validate({ params: workspaceMemberParamsSchema, body: updateMemberRoleSchema }),
  updateRole,
);
router.delete(
  "/:userId",
  validate({ params: workspaceMemberParamsSchema }),
  remove,
);

export default router;
