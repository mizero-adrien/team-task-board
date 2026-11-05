import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User";

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  await connectDB();

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`Existing account ${email} is now an admin.`);
    } else {
      console.log(`${email} is already an admin. Nothing to do.`);
    }
    return;
  }

  await User.create({ name, email, password, role: "admin" });
  console.log(`Admin account created for ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(disconnectDB);