import { Router } from "express";
import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/workspace.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createWorkspaceSchema,
  listWorkspacesQuerySchema,
  updateWorkspaceSchema,
  workspaceIdParamsSchema,
} from "../validators/workspace.validator";

const router = Router();

router.use(authenticate);

router.post("/", validate({ body: createWorkspaceSchema }), create);
router.get("/", validate({ query: listWorkspacesQuerySchema }), list);
router.get("/:workspaceId", validate({ params: workspaceIdParamsSchema }), getById);
router.patch(
  "/:workspaceId",
  validate({ params: workspaceIdParamsSchema, body: updateWorkspaceSchema }),
  update,
);
router.delete("/:workspaceId", validate({ params: workspaceIdParamsSchema }), remove);

export default router;
