import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your .env file.");
  }

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  await mongoose.connect(uri);
  console.log(`MongoDB connected to database "${mongoose.connection.name}"`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}