import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import inviteActionRoutes from "./routes/inviteAction.routes";
import inviteRoutes from "./routes/invite.routes";
import workspaceMemberRoutes from "./routes/workspaceMember.routes";
import workspaceRoutes from "./routes/workspace.routes";
import routes from "./routes";

const app = express();

app.disable("x-powered-by");

// Only our own frontend may call the API from a browser
const allowedOrigins: string[] = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
if (process.env.NODE_ENV !== "production") allowedOrigins.push("http://localhost:5173");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/members", workspaceMemberRoutes);
app.use("/api/workspaces/:workspaceId/invites", inviteRoutes);
app.use("/api/invites", inviteActionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
