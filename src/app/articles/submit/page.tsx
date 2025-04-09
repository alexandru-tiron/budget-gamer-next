import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { ArticleSubmitForm } from "./_components/article-form";

export default function ArticleSubmitPage() {
  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Submit Article</h1>
          <Link
            href="/"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl">
          <p className="mb-6 text-gray-600">
            Find an interesting gaming deal or news article? Submit it here for
            review and sharing with the community.
          </p>
          <ArticleSubmitForm />
        </div>
      </main>
    </HydrateClient>
  );
}
