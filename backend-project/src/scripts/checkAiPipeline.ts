import "dotenv/config";
import { Types } from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { AiRequest } from "../models/AiRequest";
import { AiUsage } from "../models/AiUsage";
import { AiOutputError, notesFromFixes, parseSuggestions } from "../ai/parseOutput";
import type { GenerateFn } from "../ai/llmClient";
import { runBreakdown, type BreakdownInput } from "../services/ai.service";
import { getUsage } from "../services/aiUsage.service";
import { addDays, daysBetween, startOfNextDayISO } from "../utils/dates";
import { HttpError } from "../utils/HttpError";

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
}

const lists = [
  { id: "l1", name: "To do" },
  { id: "l2", name: "Doing" },
  { id: "l3", name: "Done" },
];
const ctx = { today: "2026-11-09", deadline: "2026-11-30" as string | null, lists };
const wrap = (cards: unknown[]) => JSON.stringify({ cards });
const card = (extra: Record<string, unknown> = {}) => ({
  title: "Do a thing",
  description: "Details.",
  list: "To do",
  due_in_days: 3,
  ...extra,
});

function throwsOutputError(text: string): boolean {
  try {
    parseSuggestions(text, ctx);
    return false;
  } catch (error) {
    return error instanceof AiOutputError;
  }
}

async function codeOf(action: () => Promise<unknown>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return error instanceof HttpError ? error.code : "OTHER";
  }
}

function parsing() {
  console.log("\n--- Checking the AI's output ---");

  const fenced = parseSuggestions("```json\n" + wrap([card()]) + "\n```", ctx);
  check("JSON inside code fences is accepted", fenced.suggestions.length === 1);

  const chatty = parseSuggestions("Sure! Here you go:\n" + wrap([card()]) + "\nHope it helps.", ctx);
  check("JSON with text around it is accepted", chatty.suggestions.length === 1);

  check("Text with no JSON is rejected", throwsOutputError("I cannot help with that."));
  check("Broken JSON is rejected", throwsOutputError('{"cards": [{"title": '));
  check('"cards" that is not a list is rejected', throwsOutputError('{"cards": "none"}'));
  check("Cards that are all unusable are rejected", throwsOutputError(wrap([{ nothing: 1 }, 42])));
  check("An empty list is accepted, not an error", parseSuggestions(wrap([]), ctx).suggestions.length === 0);

  const many = parseSuggestions(wrap(Array.from({ length: 14 }, (_, i) => card({ title: `Task ${i}` }))), ctx);
  check("14 cards are cut to 10", many.suggestions.length === 10);
  check("The cut is reported", many.fixes.filter((f) => f === "trimmed_to_10").length === 4);

  const unknown = parseSuggestions(wrap([card({ list: "Backlog" })]), ctx);
  check("Unknown list becomes the FIRST list", unknown.suggestions[0].listId === "l1");

  const sloppy = parseSuggestions(wrap([card({ list: "  doing " })]), ctx);
  check("List names match ignoring case and spaces", sloppy.suggestions[0].listId === "l2");

  check("A past date becomes today", parseSuggestions(wrap([card({ due_in_days: -4 })]), ctx).suggestions[0].dueDate === "2026-11-09");
  check("A date after the deadline becomes the deadline", parseSuggestions(wrap([card({ due_in_days: 60 })]), ctx).suggestions[0].dueDate === "2026-11-30");
  check("A number sent as text still works", parseSuggestions(wrap([card({ due_in_days: "5" })]), ctx).suggestions[0].dueDate === "2026-11-14");
  check("A missing date stays empty", parseSuggestions(wrap([card({ due_in_days: null })]), ctx).suggestions[0].dueDate === null);

  const noDeadline = parseSuggestions(wrap([card({ due_in_days: 900 })]), { ...ctx, deadline: null });
  check("Without a deadline, dates stop at one year", noDeadline.suggestions[0].dueDate === "2027-11-09");

  const dupes = parseSuggestions(wrap([card(), card({ title: "  do A THING " })]), ctx);
  check("Duplicate titles are removed", dupes.suggestions.length === 1);

  const withAssignee = parseSuggestions(wrap([card({ assignee: "Rachel", assigneeId: "123" })]), ctx);
  check("An assignee from the AI is ignored", !("assignee" in withAssignee.suggestions[0]) && !("assigneeId" in withAssignee.suggestions[0]));

  const long = parseSuggestions(wrap([card({ title: "x".repeat(300) })]), ctx);
  check("A title over 200 characters is shortened", long.suggestions[0].title.length === 200);

  check("Notes are written for fixes", notesFromFixes(["date_in_past", "date_in_past", "unknown_list"], "To do").length === 2);
}

function dateHelpers() {
  console.log("\n--- Date helpers ---");
  check("addDays within a month", addDays("2026-11-09", 30) === "2026-12-09");
  check("addDays across a year", addDays("2026-12-25", 10) === "2027-01-04");
  check("daysBetween", daysBetween("2026-11-09", "2026-11-30") === 21);
  const reset = new Date(startOfNextDayISO()).getTime();
  check("The daily reset is in the next 25 hours", reset > Date.now() && reset < Date.now() + 25 * 3_600_000);
}

async function pipeline() {
  console.log("\n--- The whole pipeline, with a fake AI and the real database ---");
  process.env.AI_DAILY_LIMIT = "3";

  const userId = new Types.ObjectId().toString();
  const input: BreakdownInput = {
    userId,
    boardId: new Types.ObjectId().toString(),
    workspaceId: new Types.ObjectId().toString(),
    lists,
    goal: "Launch the school website",
    deadline: null,
  };

  let calls = 0;
  const good: GenerateFn = async () => {
    calls += 1;
    return wrap([card({ title: "Collect content" }), card({ title: "Design layout", list: "Doing" })]);
  };
  const broken: GenerateFn = async () => {
    calls += 1;
    return "I am sorry, I cannot do that.";
  };
  const down: GenerateFn = async () => {
    calls += 1;
    throw new HttpError(502, "AI_UNAVAILABLE", "down");
  };

  const ok = await runBreakdown(input, { generate: good });
  check("A good answer gives suggestions and a batch id", ok.suggestions.length === 2 && ok.batchId.startsWith("b_"));
  check("It reports usage 1 of 3", ok.usage.used === 1 && ok.usage.limit === 3 && ok.usage.remaining === 2);

  calls = 0;
  check("The provider being down gives AI_UNAVAILABLE", (await codeOf(() => runBreakdown(input, { generate: down }))) === "AI_UNAVAILABLE");
  check("A provider failure costs nothing (usage is still 1)", (await getUsage(userId)).used === 1);

  calls = 0;
  check("Unusable answers twice give AI_INVALID_OUTPUT", (await codeOf(() => runBreakdown(input, { generate: broken }))) === "AI_INVALID_OUTPUT");
  check("It asked exactly twice", calls === 2);
  check("An unusable answer costs nothing (usage is still 1)", (await getUsage(userId)).used === 1);

  calls = 0;
  let first = true;
  const flaky: GenerateFn = async (args) => (first ? ((first = false), broken(args)) : good(args));
  const retried = await runBreakdown(input, { generate: flaky });
  check("A bad answer followed by a good one succeeds", retried.suggestions.length === 2 && calls === 2);
  check("The retry counted as ONE breakdown (usage 2)", (await getUsage(userId)).used === 2);

  await runBreakdown(input, { generate: good });
  calls = 0;
  check("The 4th request gives AI_LIMIT_REACHED", (await codeOf(() => runBreakdown(input, { generate: good }))) === "AI_LIMIT_REACHED");
  check("Over the limit, the AI was never called", calls === 0);

  const statuses = (await AiRequest.find({ user: userId })).map((row) => row.status);
  check("Every call was logged", statuses.length >= 6);
  check("The log has success, provider_error, invalid_output and limit_reached",
    ["success", "provider_error", "invalid_output", "limit_reached"].every((s) => statuses.includes(s as never)));

  await AiUsage.deleteMany({ user: userId });
  await AiRequest.deleteMany({ user: userId });
}

async function main() {
  parsing();
  dateHelpers();

  await connectDB();
  await AiUsage.init();
  await pipeline();

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
}

main()
  .catch((error) => {
    console.error("Test crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (failures > 0) process.exitCode = 1;
    await disconnectDB();
  });
