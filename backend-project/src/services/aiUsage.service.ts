import { AiUsage } from "../models/AiUsage";
import { startOfNextDayISO, todayString } from "../utils/dates";
import { HttpError } from "../utils/HttpError";

const DEFAULT_LIMIT = 10;
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export function getDailyLimit(): number {
  const value = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_LIMIT;
}

export type Usage = { used: number; limit: number; remaining: number; resetsAt: string };

const toUsage = (used: number, limit: number): Usage => ({
  used,
  limit,
  remaining: Math.max(0, limit - used),
  resetsAt: startOfNextDayISO(),
});

// Takes ONE slot, or throws 429 when today's limit is used up.
// The update only matches while count < limit. When it matches nothing, MongoDB tries
// to INSERT instead, and the unique { user, date } index refuses it (error 11000).
// Two requests at the same instant therefore cannot both take the last slot.
export async function reserveSlot(userId: string, date: string = todayString()): Promise<Usage> {
  const limit = getDailyLimit();

  try {
    const doc = await AiUsage.findOneAndUpdate(
      { user: userId, date, count: { $lt: limit } },
      { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + SIXTY_DAYS_MS) } },
      { upsert: true, returnDocument: "after" }
    );

    return toUsage(doc?.count ?? limit, limit);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new HttpError(
        429,
        "AI_LIMIT_REACHED",
        `You've used all ${limit} breakdowns for today. Add cards by hand, or try again tomorrow.`,
        { usage: toUsage(limit, limit) }
      );
    }
    throw error;
  }
}

// Gives a slot back when the failure was ours. It never throws: it runs while
// another error is already being handled.
export async function refundSlot(userId: string, date: string = todayString()): Promise<void> {
  try {
    await AiUsage.updateOne({ user: userId, date, count: { $gt: 0 } }, { $inc: { count: -1 } });
  } catch (error) {
    console.error("Could not refund an AI slot:", error instanceof Error ? error.message : error);
  }
}

export async function getUsage(userId: string): Promise<Usage> {
  const doc = await AiUsage.findOne({ user: userId, date: todayString() });
  return toUsage(doc?.count ?? 0, getDailyLimit());
}
