import type { CalendarEvent } from "@/types";

export interface EventOccurrence {
  event: CalendarEvent;
  /** ISO "YYYY-MM-DD" — the specific day this instance lands on */
  occurrenceDate: string;
}

export function expandEventsForRange(
  events: CalendarEvent[],
  rangeStart: string,
  rangeEnd: string
): EventOccurrence[] {
  const windowStart = parseDate(rangeStart);
  const windowEnd = parseDate(rangeEnd);
  windowEnd.setHours(23, 59, 59, 999);

  const result: EventOccurrence[] = [];

  for (const event of events) {
    const eventStart = event.startDate.toDate();

    if (!event.recurring) {
      const eventDateStr = toISODate(eventStart);
      if (eventStart >= windowStart && eventStart <= windowEnd) {
        result.push({ event, occurrenceDate: eventDateStr });
      }
    } else {
      const { frequency, interval } = event.recurring;
      const recurEndDate = event.recurring.endDate?.toDate() ?? null;

      let cursor = fastForwardToWindow(new Date(eventStart), windowStart, frequency, interval);

      while (cursor <= windowEnd) {
        if (recurEndDate && cursor > recurEndDate) break;
        if (cursor >= windowStart) {
          result.push({ event, occurrenceDate: toISODate(cursor) });
        }
        cursor = advanceByFrequency(cursor, frequency, interval);
      }
    }
  }

  result.sort((a, b) => {
    const dateDiff = a.occurrenceDate.localeCompare(b.occurrenceDate);
    if (dateDiff !== 0) return dateDiff;
    if (a.event.allDay !== b.event.allDay) return a.event.allDay ? -1 : 1;
    return a.event.startDate.toMillis() - b.event.startDate.toMillis();
  });

  return result;
}

export function getOccurrencesForDay(
  occurrences: EventOccurrence[],
  isoDate: string
): EventOccurrence[] {
  return occurrences.filter((o) => o.occurrenceDate === isoDate);
}

export function getDatesWithEvents(occurrences: EventOccurrence[]): Set<string> {
  return new Set(occurrences.map((o) => o.occurrenceDate));
}

function fastForwardToWindow(
  cursor: Date,
  windowStart: Date,
  frequency: string,
  interval: number
): Date {
  if (cursor >= windowStart) return cursor;
  const diffMs = windowStart.getTime() - cursor.getTime();
  let stepsToSkip = 0;

  switch (frequency) {
    case "daily":
      stepsToSkip = Math.floor(diffMs / (interval * 86400000));
      break;
    case "weekly":
      stepsToSkip = Math.floor(diffMs / (interval * 7 * 86400000));
      break;
    case "monthly":
      stepsToSkip = Math.floor(diffMs / (interval * 30.44 * 86400000));
      break;
    case "yearly":
      stepsToSkip = Math.floor(diffMs / (interval * 365.25 * 86400000));
      break;
  }

  if (stepsToSkip > 1) stepsToSkip -= 1;

  let result = new Date(cursor);
  for (let i = 0; i < stepsToSkip; i++) {
    result = advanceByFrequency(result, frequency, interval);
  }
  return result;
}

function advanceByFrequency(date: Date, frequency: string, interval: number): Date {
  const d = new Date(date);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + interval);
      break;
    case "weekly":
      d.setDate(d.getDate() + interval * 7);
      break;
    case "monthly": {
      const originalDay = d.getDate();
      d.setMonth(d.getMonth() + interval);
      if (d.getDate() < originalDay) d.setDate(0);
      break;
    }
    case "yearly":
      d.setFullYear(d.getFullYear() + interval);
      break;
  }
  return d;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}
