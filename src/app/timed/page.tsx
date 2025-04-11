import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import Loader from "../_components/common/Loader";
import SubcriptionGameList from "../_components/SubscriptionList/SubcriptionGameList";
import type { SubscriptionGame } from "~/types/game";
import { getSubscriptionGames } from "~/server/queries";
import Image from "next/image";

export default async function Timed() {
  const games = await getSubscriptionGames();
  console.log(games);

  return (
    <HydrateClient>
      <div className="h-full w-full flex-1 flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
        <Suspense fallback={<Loader />}>
          {games.length === 0 ? (
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
                  There are no free games
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Try again later or submit a game if you know about a free one.
                </p>
              </div>
            </div>
          ) : (
            <>
              <SubcriptionGameList
                games={
                  games.filter(
                    (game) => game.provider_id === "amazon_games",
                  ) as SubscriptionGame[]
                }
                provider="amazon_games"
              />
              <SubcriptionGameList
                games={
                  games.filter(
                    (game) => game.provider_id === "humble_bundle",
                  ) as SubscriptionGame[]
                }
                provider="humble_bundle"
              />
              <SubcriptionGameList
                games={
                  games.filter(
                    (game) => game.provider_id === "playstation",
                  ) as SubscriptionGame[]
                }
                provider="playstation"
                type="portrait"
              />
            </>
          )}
        </Suspense>
      </div>
    </HydrateClient>
  );
}
