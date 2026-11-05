import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db";

connectDB()
  .then(() => console.log("Connection works."))
  .catch((error: Error) => {
    console.error("Connection failed:", error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);