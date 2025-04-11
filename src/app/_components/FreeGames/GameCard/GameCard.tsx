"use client";

import { useState, Suspense } from "react";
import type { FreeGame, SubscriptionGame } from "~/types/game";
import Image from "next/image";
import GameCardSkeleton from "./GameCardSkeleton";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { GameSidePanel } from "../../SidePanel/GameSidePanel";

const ProviderStrings = {
  steam: "Steam",
  epic_games: "Epic Games",
  gog: "GOG",
  origin: "Origin",
  battle: "Battle.net",
  none: "Unknown",
};

export default function GameCard({
  game,
  className,
}: {
  game: FreeGame | SubscriptionGame;
  className?: string;
}) {
  const [isClicked, setIsClicked] = useState(false);
  const { setSidePanel } = useSidePanelContext();
  const handleCardClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    setSidePanel([<GameSidePanel key={game.id} game={game} />]);
  };

  return (
    <Suspense fallback={<GameCardSkeleton />}>
      <div
        className={(twMerge as (...args: string[]) => string)(
          "card relative mb-4 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[#1e1e1e]",
          isClicked ? "scale-[0.98] transition-transform" : "",
          className ?? "",
        )}
        onClick={handleCardClick}
      >
        <div className="relative aspect-[16/8] w-full overflow-hidden">
          <Image
            src={
              game.cover ??
              "/images/draws/empty_drawable.imageset/empty_drawable.svg"
            }
            alt={game.name}
            width={400}
            height={200}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="max-h-[8rem] p-3">
          <h3 className="line-clamp-1 text-base font-medium text-ellipsis text-white">
            {game.name}
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Image
                src={`/images/icons/provider_logos/logo_${game.provider_id}_black.svg`}
                alt={game.provider_id}
                width={28}
                height={28}
                className="h-7 w-auto md:h-5"
              />
              <p className="text-base font-light text-gray-300 md:text-sm">
                {
                  ProviderStrings[
                    game.provider_id as keyof typeof ProviderStrings
                  ]
                }
              </p>
            </div>
            {game.end_date && (
              <div className="flex flex-col items-center text-sm font-light text-gray-300 md:text-xs">
                <span>Free until: </span>
                <span>{format(game.end_date, "dd/MM/yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
