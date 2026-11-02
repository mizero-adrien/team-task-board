// import "dotenv/config";
// import type { Server } from "node:http";
// import app from "./app";
// import { connectDB, disconnectDB } from "./config/db";

import "dotenv/config"; // must be the FIRST import, so .env is loaded before anything reads it
import app from "./app";
import { connectDB } from "./config/db";

const port = Number(process.env.PORT) || 1000;

async function start() {
  await connectDB();

  app.listen(port, () => {
    console.log(`TeamBoard API listening on port ${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
