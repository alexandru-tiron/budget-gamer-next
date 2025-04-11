import { twMerge } from "tailwind-merge";

export default function SubGameCardSkeleton({
  className,
  type,
}: {
  className?: string;
  type?: "normal" | "portrait";
}) {
  return (
    <div
      className={(twMerge as (...args: string[]) => string)(
        "flex flex-col gap-2",
        className ?? "",
        type === "portrait" ? "max-w-36" : "",
      )}
    >
      <div
        className={(twMerge as (...args: string[]) => string)(
          "bg-gray-[#1e1e1e] relative flex flex-col overflow-hidden rounded-lg",
          type === "portrait" ? "aspect-[9/14] h-52" : "aspect-[14/8] h-30",
        )}
      >
        <div className="flex h-2 items-center gap-2 bg-gray-100 px-2 py-1"></div>
        <div className="relative aspect-[9/14] w-full overflow-hidden bg-gray-200"></div>
      </div>
      <h3 className="line-clamp-2 bg-gray-100 text-sm text-ellipsis text-white"></h3>
    </div>
  );
}
