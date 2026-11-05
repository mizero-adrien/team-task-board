import "dotenv/config";
import { generate } from "../ai/llmClient";
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from "../ai/prompt";
import { notesFromFixes, parseSuggestions } from "../ai/parseOutput";
import { addDays, todayString } from "../utils/dates";

const goal = process.argv[2];
const deadlineDays = Number(process.argv[3]);

if (!goal) {
  console.error('Usage: npx tsx src/scripts/tryGoal.ts "Your goal" [deadline in days]');
  process.exit(1);
}

const lists = [
  { id: "list-1", name: "To do" },
  { id: "list-2", name: "Doing" },
  { id: "list-3", name: "Done" },
];
const today = todayString();
const deadline = Number.isFinite(deadlineDays) && deadlineDays > 0 ? addDays(today, deadlineDays) : null;

async function main() {
  console.log(`Prompt version ${PROMPT_VERSION} | today ${today} | deadline ${deadline ?? "none"}\n`);

  const raw = await generate({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt({ goal, today, deadline, listNames: lists.map((l) => l.name) }),
  });

  console.log("RAW ANSWER:\n" + raw + "\n");

  const { suggestions, fixes, returned } = parseSuggestions(raw, { today, deadline, lists });
  console.log(`CHECKED: ${suggestions.length} of ${returned} kept\n`);
  suggestions.forEach((card) =>
    console.log(`- [${card.listName}] ${card.title} (due ${card.dueDate ?? "none"})\n    ${card.description}`)
  );
  console.log("\nNOTES:", notesFromFixes(fixes, lists[0].name));
}

main().catch((error: unknown) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
