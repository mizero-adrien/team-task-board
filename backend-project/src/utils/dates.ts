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
