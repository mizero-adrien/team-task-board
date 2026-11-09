import { Router } from "express";
import * as admin from "../controllers/admin.controller";
import { adminOnly, protect } from "../middleware/auth.middleware";
import {
  validateBody,
  validateIdParam,
  validateQuery,
} from "../middleware/validate.middleware";
import {
  adminUserListQuerySchema,
  adminWorkspaceListQuerySchema,
  blockUserSchema,
  createAdminUserSchema,
  createAdminWorkspaceSchema,
  updateAdminUserSchema,
  updateAdminWorkspaceSchema,
} from "../validators/admin.validator";

const router = Router();

router.use(protect, adminOnly);

router.get("/stats", admin.stats);

router
  .route("/users")
  .get(validateQuery(adminUserListQuerySchema), admin.users)
  .post(validateBody(createAdminUserSchema), admin.createUser);

router.patch(
  "/users/:userId",
  validateIdParam("userId"),
  validateBody(updateAdminUserSchema),
  admin.updateUser,
);

router.post(
  "/users/:userId/block",
  validateIdParam("userId"),
  validateBody(blockUserSchema),
  admin.blockUser,
);

router.post("/users/:userId/unblock", validateIdParam("userId"), admin.unblockUser);

router.delete("/users/:userId", validateIdParam("userId"), admin.deleteUser);

router
  .route("/workspaces")
  .get(validateQuery(adminWorkspaceListQuerySchema), admin.workspaces)
  .post(validateBody(createAdminWorkspaceSchema), admin.createWorkspace);

router.patch(
  "/workspaces/:workspaceId",
  validateIdParam("workspaceId"),
  validateBody(updateAdminWorkspaceSchema),
  admin.updateWorkspace,
);

router.delete(
  "/workspaces/:workspaceId",
  validateIdParam("workspaceId"),
  admin.deleteWorkspace,
);

export default router;
