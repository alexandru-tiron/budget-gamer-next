export default function ArticlesCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface flex animate-pulse flex-col overflow-hidden rounded-2xl ring-1 ring-white/5"
    >
      <div className="bg-surface-2 aspect-[16/8] w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="bg-surface-2 h-4 w-3/4 rounded-full" />
        <div className="bg-surface-2 h-3 w-full rounded-full" />
        <div className="bg-surface-2 h-3 w-5/6 rounded-full" />
      </div>
    </div>
  );
}
