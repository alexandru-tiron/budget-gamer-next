import { getAvailableSubscriptionGames } from "~/server/api/services/subscriptionGames-service";
import { db } from "~/server/db";
import { renderPerRequestIfBuiltWithoutDatabase } from "~/server/render-mode";
import PageIntro from "../_components/common/PageIntro";
import StatusMessage from "../_components/common/StatusMessage";
import { PAGE_PADDING } from "../_components/common/layout";
import SubcriptionGameList from "../_components/SubscriptionList/SubcriptionGameList";

// Regenerate at least hourly; cron jobs also revalidate on demand
export const revalidate = 3600;

// One row per service, in display order. Portrait rows suit stores with tall box art.
const SECTIONS: { provider: string; type?: "normal" | "portrait" }[] = [
  { provider: "amazon_games" },
  { provider: "humble_bundle" },
  { provider: "playstation", type: "portrait" },
  { provider: "xbox_game_pass", type: "portrait" },
  { provider: "xbox_free_play_days" },
  { provider: "nintendo_switch_online" },
];

export default async function Timed() {
  await renderPerRequestIfBuiltWithoutDatabase();
  const games = await getAvailableSubscriptionGames(db);
  const services = new Set(games.map((game) => game.provider_id)).size;

  return (
    <div className={`h-full w-full ${PAGE_PADDING}`}>
      {games.length === 0 ? (
        <StatusMessage
          title="There are no subscription games"
          description="Try again later, we check for new ones every day."
        />
      ) : (
        <>
          <PageIntro
            eyebrow="With your subscription"
            title={`${games.length} games across ${services === 1 ? "1 service" : `${services} services`}`}
            description="Included with memberships you may already pay for, for a limited time."
          />
          <div className="flex flex-col gap-10">
            {SECTIONS.map(({ provider, type }) => (
              <SubcriptionGameList
                key={provider}
                games={games.filter((game) => game.provider_id === provider)}
                provider={provider}
                type={type}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
