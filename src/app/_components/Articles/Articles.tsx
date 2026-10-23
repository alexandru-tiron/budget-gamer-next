import type { Article } from "~/types/game";
import ArticlesCard from "./ArticlesCard/ArticlesCard";
import PageIntro from "../common/PageIntro";
import StatusMessage from "../common/StatusMessage";
import { CARD_GRID } from "../common/layout";

export default function Articles({ articles }: { articles: Article[] }) {
  return articles.length === 0 ? (
    <StatusMessage
      title="There are no giveaways"
      description="Try checking again later or submit an article if you know about an active giveaway."
    />
  ) : (
    <>
      <PageIntro
        eyebrow="Around the web"
        title={
          articles.length === 1
            ? "1 giveaway worth a look"
            : `${articles.length} giveaways worth a look`
        }
        description="Free keys and limited-time offers from other sites. Each one opens on the site running it."
      />
      <ul className={CARD_GRID}>
        {articles.map((article, index) => (
          <li key={article.id}>
            <ArticlesCard article={article} index={index} />
          </li>
        ))}
      </ul>
    </>
  );
}
