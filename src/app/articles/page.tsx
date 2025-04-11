import { Suspense } from "react";

import { api, HydrateClient } from "~/trpc/server";
import Loader from "../_components/common/Loader";
import { getArticles } from "~/server/queries";
import Articles from "../_components/Articles/Articles";
import AddLinkButton from "../_components/common/AddLinkButton";

export default async function Home() {
  const articles = await getArticles();
  console.log(articles);
  const handleSubmit = async (link: string, type: "game" | "article") => {
    "use server";
    if (link) {
      if (type === "game") {
        await api.freeGames.validateGameLink({
          link,
        });
      } else {
        await api.articles.validateAndCreateArticle({
          link,
        });
      }
    }
  };
  return (
    <HydrateClient>
        <div className="h-full w-full px-4 py-6 md:px-6 lg:px-8">
          <Suspense fallback={<Loader />}>
            <Articles articles={articles} />
          </Suspense>
        </div>
        <AddLinkButton type="article" handleSubmit={handleSubmit} />
    </HydrateClient>
  );
}
