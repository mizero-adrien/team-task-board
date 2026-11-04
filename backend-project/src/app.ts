import express from "express";
import cors from "cors";
<<<<<<< HEAD
import express from "express";
import { errorHandler, notFound } from "./middleware/error";
import inviteActionRoutes from "./routes/inviteAction.routes";
import inviteRoutes from "./routes/invite.routes";
import workspaceMemberRoutes from "./routes/workspaceMember.routes";
import workspaceRoutes from "./routes/workspace.routes";
=======
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
>>>>>>> 0cbe3a92cb8cd89b942609132c01df61bdf1c61f

const app = express();

app.disable("x-powered-by");

// Only our own frontend may call the API from a browser
const allowedOrigins: string[] = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
if (process.env.NODE_ENV !== "production") allowedOrigins.push("http://localhost:5173");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

<<<<<<< HEAD
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/members", workspaceMemberRoutes);
app.use("/api/workspaces/:workspaceId/invites", inviteRoutes);
app.use("/api/invites", inviteActionRoutes);

app.use(notFound);
=======
app.use(notFoundHandler);
>>>>>>> 0cbe3a92cb8cd89b942609132c01df61bdf1c61f
app.use(errorHandler);

export default app;
