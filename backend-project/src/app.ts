import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/error";
import inviteActionRoutes from "./routes/inviteAction.routes";
import inviteRoutes from "./routes/invite.routes";
import workspaceMemberRoutes from "./routes/workspaceMember.routes";
import workspaceRoutes from "./routes/workspace.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/members", workspaceMemberRoutes);
app.use("/api/workspaces/:workspaceId/invites", inviteRoutes);
app.use("/api/invites", inviteActionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
