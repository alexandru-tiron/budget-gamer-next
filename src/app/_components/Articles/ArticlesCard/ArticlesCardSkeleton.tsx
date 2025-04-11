export default function ArticlesCardSkeleton() {
  return (
    <div className="card relative mb-4 flex flex-col overflow-hidden rounded-xl bg-[#1e1e1e] shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100" />
      <div className="p-3">
        <div className="mb-2 h-4 w-24 rounded-full bg-gray-100" />
        <div className="mb-2 h-4 w-32 rounded-full bg-gray-100" />
        <div className="h-4 w-28 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
