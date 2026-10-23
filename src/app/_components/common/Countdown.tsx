"use client";

import { useEffect, useState } from "react";
import { formatDate } from "./format";
import { formatTimeLeft, isUrgent } from "./time-left";

/**
 * Re-renders every `intervalMs` so relative times stay current.
 */
function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * "3d 4h left" badge that turns red in the last 24 hours. The exact date is in the tooltip
 * and in the `<time>` element for assistive tech.
 */
export default function Countdown({
  end,
  className = "",
}: {
  end: Date;
  className?: string;
}) {
  const now = useNow(60_000);
  const urgent = isUrgent(end, now);

  return (
    <time
      dateTime={end.toISOString()}
      title={`Free until ${formatDate(end, true)}`}
      // Server and browser clocks differ slightly, so the text may change on hydration
      suppressHydrationWarning
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap backdrop-blur-md ${
        urgent
          ? "bg-red-500/85 text-white"
          : "bg-black/60 text-gray-100 ring-1 ring-white/10"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${urgent ? "animate-pulse bg-white" : "bg-emerald-400"}`}
      />
      {formatTimeLeft(end, now)}
    </time>
  );
}
