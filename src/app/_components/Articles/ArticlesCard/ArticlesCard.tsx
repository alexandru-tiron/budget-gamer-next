import type { Article } from "~/types/game";
import Image from "next/image";
import { FALLBACK_COVER } from "../../common/labels";

export default function ArticlesCard({
  article,
  index = 0,
}: {
  article: Article;
  /** Position in the grid, used to stagger the entrance animation */
  index?: number;
}) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      className="group animate-fade-up bg-surface hover:ring-accent/50 relative flex h-full flex-col overflow-hidden rounded-2xl ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgb(105_74_206_/_0.6)] focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.99]"
    >
      <div className="bg-surface-2 relative aspect-[16/8] w-full overflow-hidden">
        <Image
          src={article.cover || FALLBACK_COVER}
          alt=""
          // Preview images can come from any site, so skip the image optimizer
          unoptimized
          width={400}
          height={200}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        />
        {article.domain && (
          <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-gray-100 ring-1 ring-white/10 backdrop-blur-md">
            {article.domain}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold text-white">
          {article.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </h3>
        <p className="line-clamp-2 text-sm text-gray-400">
          {article.description}
        </p>
        <span
          aria-hidden="true"
          className="text-accent mt-auto inline-flex translate-x-1 items-center gap-1 pt-1 text-xs font-medium opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          Open giveaway
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
            <path
              fillRule="evenodd"
              d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    </a>
  );
}
