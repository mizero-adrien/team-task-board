import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
// Teammates add their routers here, one line each:
// router.use("/workspaces", workspaceRoutes);
// router.use("/boards", boardRoutes);
export default router;