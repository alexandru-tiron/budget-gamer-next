import { getAvailableFreeGames } from "~/server/api/services/freeGames-service";
import { db } from "~/server/db";
import { renderPerRequestIfBuiltWithoutDatabase } from "~/server/render-mode";
import FreeGames from "./_components/FreeGames/FreeGames";
import AddLinkButton from "./_components/common/AddLinkButton";

// Regenerate at least hourly; cron jobs and link submissions also revalidate on demand
export const revalidate = 3600;

export default async function Home() {
  await renderPerRequestIfBuiltWithoutDatabase();
  const games = await getAvailableFreeGames(db);

  return (
    <>
      <div className="h-full w-full px-4 py-6 md:px-6 lg:px-10">
        <FreeGames games={games} />
      </div>
      <AddLinkButton type="game" />
    </>
  );
}
