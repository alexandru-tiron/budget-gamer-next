import Link from "next/link";
import Image from "next/image";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";

export default async function ArticlesPage() {
  const articles = await api.articles.getAvailableArticles();

  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gaming Articles</h1>
          <div className="flex gap-2">
            <Link
              href="/articles/submit"
              className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
            >
              Submit Article
            </Link>
            <Link
              href="/"
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {!articles || articles.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-xl text-gray-600">
              No articles available right now.
            </p>
            <Link
              href="/articles/submit"
              className="mt-4 inline-block rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
            >
              Submit the first article
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col overflow-hidden rounded-lg border shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={article.cover}
                    alt={article.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <span className="inline-block rounded bg-gray-800 px-2 py-1 text-xs text-white">
                      {article.domain}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="mb-2 line-clamp-2 text-xl font-semibold">
                    {article.title}
                  </h2>
                  <p className="mb-4 line-clamp-3 flex-1 text-gray-600">
                    {article.description}
                  </p>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto self-start rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                  >
                    Read More
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </HydrateClient>
  );
}
