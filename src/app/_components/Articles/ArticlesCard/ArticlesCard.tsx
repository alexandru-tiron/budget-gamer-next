"use client";

import { Suspense } from "react";
import type { Article } from "~/types/game";
import Image from "next/image";
import ArticlesCardSkeleton from "./ArticlesCardSkeleton";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

export default function ArticlesCard({
  article,
  className,
}: {
  article: Article;
  className?: string;
}) {
  return (
    <Suspense fallback={<ArticlesCardSkeleton />}>
      <Link
        href={article.link}
        className={(twMerge as (...args: string[]) => string)(
          "card relative mb-4 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[#1e1e1e]",
          className ?? "",
        )}
      >
        <div className="relative aspect-[16/8] w-full overflow-hidden">
          <Image
            src={
              article.cover ??
              "/images/draws/empty_drawable.imageset/empty_drawable.svg"
            }
            alt={article.title}
            width={400}
            height={200}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="max-h-30 p-3">
          <h3 className="line-clamp-1 h-6 text-base font-medium text-ellipsis text-white">
            {article.title}
          </h3>
          <div className="mt-1 flex flex-col gap-1 text-base font-light text-gray-300 md:text-sm">
            <p className="line-clamp-2">{article.description}</p>
            <p className="text-xs">{article.domain}</p>
          </div>
        </div>
      </Link>
    </Suspense>
  );
}
