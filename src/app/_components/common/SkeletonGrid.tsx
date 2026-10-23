import type { ReactNode } from "react";
import { CARD_GRID, PAGE_PADDING } from "./layout";

/**
 * Lays out placeholder cards in the same grid as the real lists while a page loads.
 */
export default function SkeletonGrid({
  label,
  count = 8,
  children,
}: {
  label: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <div role="status" className={`h-full w-full ${PAGE_PADDING}`}>
      <span className="sr-only">{label}</span>
      <div className="mb-6 flex flex-col gap-2" aria-hidden="true">
        <div className="bg-surface-2 h-3 w-24 animate-pulse rounded-full" />
        <div className="bg-surface-2 h-7 w-72 max-w-full animate-pulse rounded-full" />
      </div>
      <div className={CARD_GRID}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>{children}</div>
        ))}
      </div>
    </div>
  );
}
