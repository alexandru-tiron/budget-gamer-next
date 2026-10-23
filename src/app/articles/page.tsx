import { getAvailableArticles } from "~/server/api/services/article-service";
import { db } from "~/server/db";
import { renderPerRequestIfBuiltWithoutDatabase } from "~/server/render-mode";
import Articles from "../_components/Articles/Articles";
import AddLinkButton from "../_components/common/AddLinkButton";

// Regenerate at least hourly; cron jobs and link submissions also revalidate on demand
export const revalidate = 3600;

export default async function ArticlesPage() {
  await renderPerRequestIfBuiltWithoutDatabase();
  const articles = await getAvailableArticles(db);

  return (
    <>
      <div className="h-full w-full px-4 py-6 md:px-6 lg:px-10">
        <Articles articles={articles} />
      </div>
      <AddLinkButton type="article" />
    </>
  );
}
