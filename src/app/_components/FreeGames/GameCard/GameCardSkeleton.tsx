export default function GameCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface flex animate-pulse flex-col overflow-hidden rounded-2xl ring-1 ring-white/5"
    >
      <div className="bg-surface-2 aspect-video w-full" />
      <div className="flex flex-col gap-3 p-4">
        <div className="bg-surface-2 h-4 w-3/4 rounded-full" />
        <div className="bg-surface-2 h-4 w-1/2 rounded-full" />
        <div className="mt-2 flex gap-2">
          <div className="bg-surface-2 size-3.5 rounded-full" />
          <div className="bg-surface-2 size-3.5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
