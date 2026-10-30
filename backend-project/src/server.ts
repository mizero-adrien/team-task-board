import "dotenv/config";
import type { Server } from "node:http";
import app from "./app";
import { connectDB, disconnectDB } from "./config/db";

const port = Number(process.env.PORT) || 1000;

async function shutdown(server: Server, signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
}

async function start(): Promise<void> {
  try {
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    process.once("SIGINT", () => void shutdown(server, "SIGINT"));
    process.once("SIGTERM", () => void shutdown(server, "SIGTERM"));
  } catch (error) {
    console.error(
      "Failed to start server:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  }
}

void start();
