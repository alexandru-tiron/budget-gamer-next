import { PAGE_PADDING } from "../_components/common/layout";
import SubGameCardSkeleton from "../_components/SubscriptionList/SubGameCard.tsx/SubGameCardSkeleton";

const SECTIONS = [
  { id: "amazon", type: "normal" },
  { id: "humble", type: "normal" },
  { id: "playstation", type: "portrait" },
] as const;

export default function Loading() {
  return (
    <div
      role="status"
      className={`flex h-full w-full flex-1 flex-col gap-10 ${PAGE_PADDING}`}
    >
      <span className="sr-only">Loading subscription games</span>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="bg-surface-2 h-3 w-32 animate-pulse rounded-full" />
        <div className="bg-surface-2 h-8 w-72 max-w-full animate-pulse rounded-full" />
        <div className="bg-surface-2 h-4 w-96 max-w-full animate-pulse rounded-full" />
      </div>
      {SECTIONS.map((section) => (
        <div
          key={section.id}
          aria-hidden="true"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-surface-2 size-11 animate-pulse rounded-xl" />
            <div className="flex flex-col gap-2">
              <div className="bg-surface-2 h-5 w-44 animate-pulse rounded-full" />
              <div className="bg-surface-2 h-3 w-56 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="flex w-full gap-4 overflow-hidden px-1 pt-2 pb-4">
            {Array.from({ length: 8 }, (_, i) => (
              <SubGameCardSkeleton key={i} type={section.type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
