import "dotenv/config";
import { Types } from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { Activity, ACTIVITY_TYPES } from "../models/Activity";
import { activityMessage } from "../services/activity.messages";
import {
  listBoardActivity,
  logActivities,
  logActivity,
  parseLimit,
  type ActivityInput,
} from "../services/activity.service";

const id = () => new Types.ObjectId();

async function main() {
  await connectDB();

  const workspace = id();
  const board = id();
  const actor = { id: id(), name: "Rachel Mukawera" };

  // 1. Every type has a sentence
  console.log("--- Messages ---");
  const samples: Record<string, Record<string, unknown>> = {
    "card.moved": { cardTitle: "Design homepage", fromList: "To do", toList: "Doing" },
    "card.created": { cardTitle: "Collect photos", listName: "To do" },
    "list.renamed": { from: "Doing", to: "In progress" },
    "card.assigned": { cardTitle: "Design homepage", assigneeName: "Adrien Mizero" },
  };
  for (const [type, meta] of Object.entries(samples)) {
    console.log(" ", activityMessage(type as (typeof ACTIVITY_TYPES)[number], actor.name, meta));
  }
  const empty = ACTIVITY_TYPES.map((type) => activityMessage(type, "Rachel", {}));
  console.log("No message contains 'undefined':", empty.every((m) => !m.includes("undefined")));

  // 2. logActivity writes a clean document
  console.log("\n--- logActivity ---");
  await logActivity({
    workspace,
    board,
    actor,
    type: "card.moved",
    meta: {
      cardTitle: "Design homepage",
      fromList: "To do",
      toList: "Doing",
      // These must be dropped: meta is for NAMES, never whole documents
      wholeCard: { title: "x", secret: "y" },
      password: undefined,
    },
  });
  const saved = await Activity.findOne({ board }).sort({ createdAt: -1 });
  console.log("Saved:", saved?.type, "| actorName:", saved?.actorName);
  console.log("Nested object dropped from meta:", saved !== null && !("wholeCard" in (saved.meta ?? {})));

  // 3. It must NEVER throw, even with bad data
  console.log("\n--- Never throws ---");
  let threw = false;
  try {
    await logActivity({
      workspace,
      board,
      actor: { id: id(), name: "" }, // an empty name fails validation
      type: "card.deleted",
    });
  } catch {
    threw = true;
  }
  console.log("Bad data did not throw:", threw === false, "(an error line above is expected)");

  // 4. logActivities writes many at once
  console.log("\n--- logActivities ---");
  const batch: ActivityInput[] = Array.from({ length: 8 }, (_, index) => ({
    workspace,
    board,
    actor,
    type: "card.created" as const,
    meta: { cardTitle: `AI card ${index + 1}`, listName: "To do", via: "ai", batchId: "b_test" },
  }));
  await logActivities(batch);
  const total = await Activity.countDocuments({ board });
  console.log("Entries on the board:", total, "(expected 9: 1 move + 8 cards)");

  // 5. Pagination: page through everything with a small limit
  console.log("\n--- Pagination (limit 4) ---");
  const seen: string[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await listBoardActivity(String(board), { limit: 4, before: cursor });
    page.items.forEach((item) => seen.push(item.id));
    cursor = page.nextCursor ?? undefined;
    pages += 1;
  } while (cursor && pages < 10);
  console.log(`Pages: ${pages} (expected 3), entries seen: ${seen.length} (expected 9)`);
  console.log("No entry was repeated:", new Set(seen).size === seen.length);

  // 6. A bad cursor gives a clean validation error
  try {
    await listBoardActivity(String(board), { before: "garbage" });
    console.log("Bad cursor: FAILED (accepted)");
  } catch (error) {
    console.log("Bad cursor rejected with:", (error as Error).message);
  }

  // 7. The limit parser
  console.log("\n--- parseLimit ---");
  console.log("undefined, 5, 500, 'abc', 0:", [undefined, 5, 500, "abc", 0].map(parseLimit));
  console.log("(expected 20, 5, 100, 20, 20)");

  // 8. The response shape matches api.md
  const first = (await listBoardActivity(String(board), { limit: 1 })).items[0];
  console.log("\n--- Response shape ---");
  console.log(first);

  await Activity.deleteMany({ board });
  console.log("\nTest data removed.");
}

main()
  .catch((error) => {
    console.error("Test failed:", error);
    process.exitCode = 1;
  })
  .finally(disconnectDB);