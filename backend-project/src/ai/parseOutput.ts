import { z } from "zod";
import { addDays } from "../utils/dates";
import { MAX_CARDS } from "./prompt";

export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}

export type ListRef = { id: string; name: string };

export type Suggestion = {
  tempId: string;
  title: string;
  description: string;
  listId: string;
  listName: string;
  dueDate: string | null;
};

export type FixCode =
  | "invalid_card_dropped"
  | "duplicate_removed"
  | "trimmed_to_10"
  | "unknown_list"
  | "date_in_past"
  | "date_after_deadline"
  | "date_too_far"
  | "text_shortened";

export type ParseContext = { today: string; deadline: string | null; lists: ListRef[] };
export type ParseResult = { suggestions: Suggestion[]; fixes: FixCode[]; returned: number };

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 500;
const MAX_DAYS_AHEAD = 365;

// The AI is asked for bare JSON, but models sometimes add fences or a sentence around it
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) throw new AiOutputError("No JSON object found");

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AiOutputError("The JSON could not be parsed");
  }
}

const envelope = z.object({ cards: z.array(z.unknown()) });

// Only the title must be text. Everything else is read defensively below,
// because a model can send a number as a string, null, or nothing at all.
const rawCard = z.object({
  title: z.string(),
  description: z.unknown().optional(),
  list: z.unknown().optional(),
  due_in_days: z.unknown().optional(),
});

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function asWholeNumber(value: unknown): number | null {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(number) ? Math.round(number) : null;
}

const normalise = (value: string) => value.trim().toLowerCase();

export function parseSuggestions(text: string, context: ParseContext): ParseResult {
  const { today, deadline, lists } = context;
  const fallback = lists[0];

  const parsed = envelope.safeParse(extractJson(text));
  if (!parsed.success) throw new AiOutputError('The answer has no "cards" list');

  const listByName = new Map(lists.map((list) => [normalise(list.name), list]));
  const seenTitles = new Set<string>();
  const suggestions: Suggestion[] = [];
  const fixes: FixCode[] = [];

  for (const item of parsed.data.cards) {
    const card = rawCard.safeParse(item);
    if (!card.success) {
      fixes.push("invalid_card_dropped");
      continue;
    }

    let title = card.data.title.replace(/\s+/g, " ").trim();
    if (!title) {
      fixes.push("invalid_card_dropped");
      continue;
    }
    if (title.length > MAX_TITLE) {
      title = title.slice(0, MAX_TITLE).trimEnd();
      fixes.push("text_shortened");
    }

    // The same task twice is noise
    const key = title.toLowerCase();
    if (seenTitles.has(key)) {
      fixes.push("duplicate_removed");
      continue;
    }

    if (suggestions.length >= MAX_CARDS) {
      fixes.push("trimmed_to_10");
      continue;
    }
    seenTitles.add(key);

    let description = asText(card.data.description);
    if (description.length > MAX_DESCRIPTION) {
      description = description.slice(0, MAX_DESCRIPTION).trimEnd();
      fixes.push("text_shortened");
    }

    // An unknown list name becomes the board's FIRST list
    let list = listByName.get(normalise(asText(card.data.list)));
    if (!list) {
      fixes.push("unknown_list");
      list = fallback;
    }

    // Dates: never in the past, never after the deadline, never absurdly far away
    let dueDate: string | null = null;
    let days = asWholeNumber(card.data.due_in_days);

    if (days !== null) {
      if (days < 0) {
        fixes.push("date_in_past");
        days = 0;
      }
      if (days > MAX_DAYS_AHEAD) {
        fixes.push("date_too_far");
        days = MAX_DAYS_AHEAD;
      }

      dueDate = addDays(today, days);

      // YYYY-MM-DD strings compare correctly as plain text
      if (deadline && dueDate > deadline) {
        fixes.push("date_after_deadline");
        dueDate = deadline;
      }
    }

    // There is no assignee field anywhere in this object: the AI never assigns people
    suggestions.push({
      tempId: `s${suggestions.length + 1}`,
      title,
      description,
      listId: list.id,
      listName: list.name,
      dueDate,
    });
  }

  // Cards came back but none were usable: treat it as a failed answer, so it gets retried
  if (parsed.data.cards.length > 0 && suggestions.length === 0) {
    throw new AiOutputError("None of the suggested cards were usable");
  }

  return { suggestions, fixes, returned: parsed.data.cards.length };
}

// Short plain sentences for the preview screen
export function notesFromFixes(fixes: FixCode[], firstListName: string): string[] {
  const count = (code: FixCode) => fixes.filter((fix) => fix === code).length;
  const notes: string[] = [];

  const add = (code: FixCode, build: (n: number) => string) => {
    const n = count(code);
    if (n > 0) notes.push(build(n));
  };

  const dates = (n: number) => (n === 1 ? "1 due date was" : `${n} due dates were`);

  add("date_in_past", (n) => `${dates(n)} moved to today.`);
  add("date_after_deadline", (n) => `${dates(n)} moved earlier to fit your deadline.`);
  add("date_too_far", (n) => `${dates(n)} moved closer, because they were over a year away.`);
  add("unknown_list", (n) =>
    `${n === 1 ? "1 card was" : `${n} cards were`} placed in "${firstListName}" because the AI chose a list that doesn't exist.`
  );
  add("trimmed_to_10", () => `Only the first ${MAX_CARDS} suggestions are shown.`);
  add("duplicate_removed", (n) => `${n === 1 ? "1 duplicate was" : `${n} duplicates were`} removed.`);
  add("invalid_card_dropped", (n) => `${n === 1 ? "1 unusable suggestion was" : `${n} unusable suggestions were`} skipped.`);
  add("text_shortened", () => "Some long text was shortened.");

  return notes;
}
