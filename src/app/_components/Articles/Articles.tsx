import type { Article } from "~/types/game";
import ArticlesCard from "./ArticlesCard/ArticlesCard";
import Image from "next/image";

export default function Articles({ articles }: { articles: Article[] }) {
  return articles.length === 0 ? (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div className="flex w-full flex-col items-center justify-center md:w-1/2 lg:w-1/3">
        <Image
          src="/images/draws/empty_drawable.imageset/empty_drawable_dark.svg"
          alt="No free games"
          width={100}
          height={100}
          className="h-full w-full object-contain"
        />
        <h4 className="mb-2 font-medium text-[#694ace]">
          There are no giveaways
        </h4>
        <p className="text-gray-600 dark:text-gray-300">
          Try checking again later or submit an article if you know about an
          active giveaway.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex w-full flex-wrap gap-4 lg:px-4">
      {articles.map((article) => (
        <ArticlesCard
          key={article.id}
          article={article}
          className="w-full md:w-[calc(33.333333%-0.6666666666666666rem)] lg:w-[calc(25%-0.75rem)]"
        />
      ))}
    </div>
  );
}
