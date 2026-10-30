import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((_req, res) => {
  res.status(404).json({
    message: "The requested resource was not found",
    code: "NOT_FOUND",
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled request error:", error);
  res.status(500).json({
    message: "Something went wrong",
    code: "SERVER_ERROR",
  });
});

export default app;
