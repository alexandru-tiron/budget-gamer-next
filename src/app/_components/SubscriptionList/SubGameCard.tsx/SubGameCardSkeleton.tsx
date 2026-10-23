export default function SubGameCardSkeleton({
  type,
}: {
  type?: "normal" | "portrait";
}) {
  const portrait = type === "portrait";
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 animate-pulse flex-col gap-2.5 ${portrait ? "w-36 sm:w-40" : "w-64 sm:w-72"}`}
    >
      <div
        className={`bg-surface-2 rounded-xl ${portrait ? "aspect-[2/3]" : "aspect-video"}`}
      />
      <div className="bg-surface-2 h-3 w-3/4 rounded-full" />
    </div>
  );
}
