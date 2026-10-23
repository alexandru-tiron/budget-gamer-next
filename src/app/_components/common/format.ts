const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Format a date as dd/MM/yyyy (or dd/MM/yyyy HH:mm with `withTime`) in the viewer's time zone.
 * A few lines instead of date-fns keeps the date library out of the client bundle.
 */
export function formatDate(date: Date, withTime = false): string {
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return withTime
    ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    : day;
}
