import { Types } from "mongoose";
import { Activity, type ActivityType, type IActivity } from "../models/Activity";
import { HttpError } from "../utils/HttpError";
import { activityMessage } from "./activity.messages";

type Id = string | Types.ObjectId;

export type ActivityInput = {
  workspace: Id;
  board?: Id | null;
  card?: Id | null;
  actor: { id: Id; name: string };
  type: ActivityType;
  meta?: Record<string, unknown>;
};

// ---------- Writing activity ----------

const MAX_TEXT = 200;
const MAX_ITEMS = 10;

// meta holds NAMES, never whole documents. Anything else is dropped,
// so a mistake cannot copy a card, a user or a password into the history.
function sanitizeMeta(meta: Record<string, unknown> = {}): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (typeof value === "string") clean[key] = value.slice(0, MAX_TEXT);
    else if (typeof value === "number" || typeof value === "boolean") clean[key] = value;
    else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      clean[key] = value.slice(0, MAX_ITEMS).map((item) => item.slice(0, MAX_TEXT));
    }
  }

  return clean;
}

const toDocument = (input: ActivityInput) => ({
  workspace: input.workspace,
  board: input.board ?? null,
  card: input.card ?? null,
  actor: input.actor.id,
  actorName: input.actor.name,
  type: input.type,
  meta: sanitizeMeta(input.meta),
});

// Records ONE activity. It never throws: a failure to write history must not
// fail the user's action. It is logged instead.
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await Activity.create(toDocument(input));
  } catch (error) {
    console.error(
      `Could not record activity "${input.type}":`,
      error instanceof Error ? error.message : error
    );
  }
}

// Records MANY at once, for example the cards added from an AI preview.
// One database call instead of ten. It never throws either.
export async function logActivities(inputs: ActivityInput[]): Promise<void> {
  if (inputs.length === 0) return;

  try {
    await Activity.insertMany(inputs.map(toDocument), { ordered: false });
  } catch (error) {
    console.error(
      `Could not record ${inputs.length} activities:`,
      error instanceof Error ? error.message : error
    );
  }
}

// ---------- Reading activity (the board feed) ----------

export type ActivityDto = {
  id: string;
  type: ActivityType;
  actor: { id: string; name: string };
  cardId: string | null;
  meta: Record<string, unknown>;
  message: string;
  createdAt: string;
};

// The shape promised in docs/api.md section 4
export function toActivityDto(activity: IActivity): ActivityDto {
  return {
    id: String(activity._id),
    type: activity.type,
    actor: { id: String(activity.actor), name: activity.actorName },
    cardId: activity.card ? String(activity.card) : null,
    meta: activity.meta ?? {},
    message: activityMessage(activity.type, activity.actorName, activity.meta),
    createdAt: activity.createdAt.toISOString(),
  };
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parseLimit(raw: unknown): number {
  const value = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

// The cursor is "<createdAt in ms>_<id>". Several entries can share the same
// millisecond (for example ten AI cards saved together), so the id breaks the tie.
// Without it, the next page could skip or repeat entries.
const encodeCursor = (activity: IActivity): string =>
  `${activity.createdAt.getTime()}_${String(activity._id)}`;

function decodeCursor(raw: string): { createdAt: Date; id: Types.ObjectId } {
  const [time, id] = raw.split("_");

  if (!time || !id || !/^\d+$/.test(time) || !/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new HttpError(400, "VALIDATION_FAILED", "Validation failed", {
      errors: [{ field: "before", message: "Invalid cursor" }],
    });
  }

  return { createdAt: new Date(Number(time)), id: new Types.ObjectId(id) };
}

export type ActivityPage = { items: ActivityDto[]; nextCursor: string | null };

export async function listBoardActivity(
  boardId: string,
  options: { limit?: number; before?: string } = {}
): Promise<ActivityPage> {
  const limit = options.limit ?? DEFAULT_LIMIT;

  const filter: Record<string, unknown> = { board: new Types.ObjectId(boardId) };

  if (options.before) {
    const cursor = decodeCursor(options.before);
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ];
  }

  // Ask for ONE extra row. If it exists, there is another page.
  const rows = await Activity.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map(toActivityDto),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  };
}