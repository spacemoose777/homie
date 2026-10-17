// Week boundaries for Chores are computed on NZ wall-clock dates (not the
// device's local time, and not UTC), because a pocket-money cutoff needs to
// be unambiguous regardless of what timezone a phone happens to be set to,
// and correct across the NZ daylight-saving changeover. The trick: ask the
// Intl API what the date is *in Pacific/Auckland* right now (it already
// knows about DST), then do the rest of the arithmetic on that date-only
// string using UTC accessors — which treats it as a plain calendar date
// instead of re-interpreting it in whatever zone the browser happens to be in.
//
// A week's doc id is just its weekStart ISO date, e.g. "2026-10-12" (a Monday).

const NZ_TZ = "Pacific/Auckland";

/** Today's date in Pacific/Auckland, as "YYYY-MM-DD". */
export function getNZTodayISO(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD directly
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Parse a "YYYY-MM-DD" string as a UTC-midnight Date — safe for pure date
 * arithmetic since there's no time-of-day component that could shift it. */
function parseDateISO(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The Monday on or before the given date. */
export function getWeekStartISO(dateISO: string): string {
  const date = parseDateISO(dateISO);
  const day = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return formatDateISO(date);
}

/** The Sunday that ends the week starting on the given Monday. */
export function getWeekEndISO(weekStartISO: string): string {
  const date = parseDateISO(weekStartISO);
  date.setUTCDate(date.getUTCDate() + 6);
  return formatDateISO(date);
}

/** The current week's bounds, based on NZ wall-clock "now". */
export function getCurrentWeekBounds(now: Date = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const todayISO = getNZTodayISO(now);
  const weekStart = getWeekStartISO(todayISO);
  const weekEnd = getWeekEndISO(weekStart);
  return { weekStart, weekEnd };
}

/** Short display range, e.g. "12 – 18 Oct 2026". */
export function formatWeekRange(weekStartISO: string, weekEndISO: string): string {
  const start = parseDateISO(weekStartISO);
  const end = parseDateISO(weekEndISO);
  const monthFmt = new Intl.DateTimeFormat("en-NZ", { month: "short", timeZone: "UTC" });
  const startMonth = monthFmt.format(start);
  const endMonth = monthFmt.format(end);
  const year = end.getUTCFullYear();
  return startMonth === endMonth
    ? `${start.getUTCDate()} – ${end.getUTCDate()} ${endMonth} ${year}`
    : `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth} ${year}`;
}

/** Is the given week (by its start date) today's week or an earlier one? */
export function isPastOrCurrentWeek(weekStartISO: string, now: Date = new Date()): boolean {
  return weekStartISO <= getCurrentWeekBounds(now).weekStart;
}
