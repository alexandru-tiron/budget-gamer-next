export const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

// Steam and Xbox announce times in Pacific time
export const PACIFIC_TIME_ZONE = "America/Los_Angeles";

/**
 * Index (0-11) of a month name or abbreviation, or -1.
 */
export function monthIndex(name: string): number {
  return MONTHS.indexOf(name.slice(0, 3).toLowerCase());
}

/**
 * Offset of `timeZone` from UTC at the given instant, in milliseconds (negative west of UTC).
 */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const zonedAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return zonedAsUtc - date.getTime();
}

/**
 * Convert a wall-clock time in `timeZone` to a UTC timestamp.
 */
export function zonedTimeToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string,
): number {
  const asUtc = Date.UTC(year, monthIndex, day, hours, minutes);
  return asUtc - getTimeZoneOffsetMs(new Date(asUtc), timeZone);
}
