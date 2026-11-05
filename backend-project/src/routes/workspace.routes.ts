import { Router } from "express";
import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/workspace.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody, validateIdParam } from "../middleware/validate.middleware";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "../validators/workspace.validator";

const router = Router();

router.use(protect);

router.post("/", validateBody(createWorkspaceSchema), create);
router.get("/", list);
router.get("/:workspaceId", validateIdParam("workspaceId"), getById);
router.patch(
  "/:workspaceId",
  validateIdParam("workspaceId"),
  validateBody(updateWorkspaceSchema),
  update,
);
router.delete("/:workspaceId", validateIdParam("workspaceId"), remove);

export default router;
