// True only for a real calendar date written as YYYY-MM-DD.
// "2026-02-31" is rejected: new Date() alone would roll it over to March 3.
export function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const APP_TIME_ZONE = process.env.APP_TIMEZONE || "Africa/Kigali";

// "Today" as YYYY-MM-DD in the app time zone, never the server's or the browser's.
// The "en-CA" locale formats dates as YYYY-MM-DD.
export function todayString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Adds days to a YYYY-MM-DD date, with no time zone involved
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const toUtc = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

// The moment the next day starts in the app time zone, as an ISO string
export function startOfNextDayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);

  const localAsUtc = Date.UTC(
    get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")
  );
  const offsetMs = localAsUtc - Math.floor(now.getTime() / 1000) * 1000;

  return new Date(Date.UTC(get("year"), get("month") - 1, get("day") + 1) - offsetMs).toISOString();
}
