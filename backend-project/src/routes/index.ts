import { Router } from "express";
import aiRoutes from "./ai.routes";
import authRoutes from "./auth.routes";
import cardRoutes from "./card.routes";
import inviteActionRoutes from "./inviteAction.routes";
import listRoutes from "./list.routes";
import inviteRoutes from "./invite.routes";
import workspaceMemberRoutes from "./workspaceMember.routes";
import workspaceRoutes from "./workspace.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use(cardRoutes);
router.use(listRoutes);
router.use(aiRoutes);
router.use("/workspaces/:workspaceId/members", workspaceMemberRoutes);
router.use("/workspaces/:workspaceId/invites", inviteRoutes);
router.use("/workspaces", workspaceRoutes);
router.use(listRoutes);
router.use("/invites", inviteActionRoutes);

export default router;