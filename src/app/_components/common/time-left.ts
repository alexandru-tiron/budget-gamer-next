const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Offers ending within this window are highlighted as urgent. */
export const URGENT_MS = DAY;

/**
 * Short, human time left until `end`, e.g. "3d 4h left", "5h 12m left", "12m left", "Ended".
 */
export function formatTimeLeft(end: Date, now: Date = new Date()): string {
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "Ended";

  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.max(1, Math.floor((ms % HOUR) / MINUTE));

  if (days >= 30) return `${Math.floor(days / 7)}w left`;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function isUrgent(end: Date, now: Date = new Date()): boolean {
  const ms = end.getTime() - now.getTime();
  return ms > 0 && ms <= URGENT_MS;
}
