import { Router } from "express";
import authRoutes from "./auth.routes";
import cardRoutes from "./card.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use(cardRoutes);
// Teammates add their routers here, one line each:
// router.use("/workspaces", workspaceRoutes);
// router.use("/boards", boardRoutes);
export default router;