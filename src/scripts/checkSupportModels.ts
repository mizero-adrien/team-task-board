import "dotenv/config";
import { Types } from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { Comment } from "../models/Comment";
import { Activity } from "../models/Activity";
import { AiUsage } from "../models/AiUsage";
import { AiRequest } from "../models/AiRequest";
import { isValidDateString, todayString } from "../utils/dates";

const id = () => new Types.ObjectId();

async function rejects(label: string, action: () => Promise<unknown>) {
  try {
    await action();
    console.log(`${label}: FAILED (it was accepted)`);
  } catch {
    console.log(`${label}: rejected, as it should be`);
  }
}

async function main() {
  await connectDB();

  console.log("Today in the app time zone:", todayString());
  console.log("Date helper: 2026-02-31 rejected:", isValidDateString("2026-02-31") === false);

  // ---------- Comment ----------
  console.log("\n--- Comment ---");
  const base = { card: id(), board: id(), workspace: id(), author: id() };
  const comment = await Comment.create({ ...base, text: "  Can we use the school colours?  " });
  console.log("Text is trimmed:", comment.text === "Can we use the school colours?");
  const commentJson = comment.toJSON() as unknown as Record<string, unknown>;
  console.log("Has id, no _id, no __v:", "id" in commentJson && !("_id" in commentJson) && !("__v" in commentJson));
  await rejects("Empty comment", () => new Comment({ ...base, text: "   " }).validate());
  await rejects("Comment over 2000 characters", () => new Comment({ ...base, text: "x".repeat(2001) }).validate());
  await Comment.deleteOne({ _id: comment._id });

  // ---------- Activity ----------
  console.log("\n--- Activity ---");
  const activity = await Activity.create({
    workspace: id(),
    board: id(),
    actor: id(),
    actorName: "Rachel Mukawera",
    type: "card.moved",
    meta: { cardTitle: "Design homepage", fromList: "To do", toList: "Doing" },
  });
  console.log("card is null by default:", activity.card === null);
  console.log("Has createdAt, no updatedAt:", activity.createdAt instanceof Date && !("updatedAt" in activity.toObject()));
  await rejects("Unknown type 'card.moveed'", () =>
    new Activity({ workspace: id(), actor: id(), actorName: "X", type: "card.moveed" }).validate()
  );
  await rejects("Oversized meta", () =>
    new Activity({
      workspace: id(),
      actor: id(),
      actorName: "X",
      type: "card.created",
      meta: { blob: "x".repeat(3000) },
    }).validate()
  );
  await rejects("Editing an activity with save()", async () => {
    activity.actorName = "Someone Else";
    await activity.save();
  });
  await rejects("Editing an activity with updateOne()", () =>
    Activity.updateOne({ _id: activity._id }, { actorName: "Hacked" })
  );
  await Activity.deleteOne({ _id: activity._id });
  console.log("Deleting is still allowed (needed when a workspace is removed)");

  // ---------- AiUsage: the atomic daily limit ----------
  console.log("\n--- AiUsage: daily limit ---");
  await AiUsage.init(); // make sure the unique index exists before testing it

  const user = id();
  const date = "2026-01-01";
  const LIMIT = 10;
  let allowed = 0;
  let blocked = 0;

  // 15 attempts at the SAME time, like 15 people clicking at once
  const attempts = Array.from({ length: 15 }, async () => {
    try {
      await AiUsage.findOneAndUpdate(
        { user, date, count: { $lt: LIMIT } },
        { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + 86_400_000) } },
        { upsert: true, returnDocument: "after" }
      );
      allowed += 1;
    } catch (error) {
      // 11000 = the unique index refused a second document: the limit was already reached
      if ((error as { code?: number }).code === 11000) blocked += 1;
      else throw error;
    }
  });
  await Promise.all(attempts);

  const finalDoc = await AiUsage.findOne({ user, date });
  console.log(`Allowed: ${allowed} (expected ${LIMIT}), blocked: ${blocked} (expected ${15 - LIMIT})`);
  console.log("Final count is exactly the limit:", finalDoc?.count === LIMIT);

  // Giving one back when the provider failed on our side
  await AiUsage.updateOne({ user, date, count: { $gt: 0 } }, { $inc: { count: -1 } });
  console.log("After a refund the count is:", (await AiUsage.findOne({ user, date }))?.count);

  await rejects("Bad usage date '2026-13-40'", () =>
    new AiUsage({ user: id(), date: "2026-13-40" }).validate()
  );
  await rejects("Negative count", () => new AiUsage({ user: id(), date, count: -1 }).validate());
  await AiUsage.deleteMany({ user });

  // ---------- AiRequest ----------
  console.log("\n--- AiRequest ---");
  const request = await AiRequest.create({
    user: id(),
    board: id(),
    workspace: id(),
    goal: "Launch the school website",
    status: "success",
    cardsReturned: 12,
    cardsKept: 10,
    fixes: ["trimmed_to_10", "date_in_past"],
    model: "test-model",
    promptVersion: "v1",
    latencyMs: 1830,
  });
  console.log("Defaults: deadline null:", request.deadline === null, "| expireAt in the future:", request.expireAt.getTime() > Date.now());
  await rejects("Unknown status 'maybe'", () =>
    new AiRequest({ user: id(), board: id(), workspace: id(), goal: "x", status: "maybe", promptVersion: "v1" }).validate()
  );
  await rejects("Missing promptVersion", () =>
    new AiRequest({ user: id(), board: id(), workspace: id(), goal: "x", status: "success" }).validate()
  );
  await rejects("Goal over 500 characters", () =>
    new AiRequest({ user: id(), board: id(), workspace: id(), goal: "x".repeat(501), status: "success", promptVersion: "v1" }).validate()
  );
  await AiRequest.deleteOne({ _id: request._id });

  console.log("\nAll test data removed.");
}

main()
  .catch((error) => {
    console.error("Test failed:", error);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
