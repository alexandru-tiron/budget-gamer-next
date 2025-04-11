"use client";

import { useState, Suspense } from "react";
import type { SubscriptionGame } from "~/types/game";
import Image from "next/image";
import SubGameCardSkeleton from "./SubGameCardSkeleton";
import { twMerge } from "tailwind-merge";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { GameSidePanel } from "~/app/_components/SidePanel/GameSidePanel";
const platformNames = {
  windows: "Windows",
  mac_os: "macOS",
  linux: "Linux",
  ps4: "PlayStation 4",
  ps5: "PlayStation 5",
  xbox_one: "Xbox One",
  xbox_classic: "Xbox Classic",
  xbox_series: "Xbox Series",
  nintendo_switch: "Nintendo Switch",
};

export default function SubGameCard({
  game,
  className,
  type,
}: {
  game: SubscriptionGame;
  className?: string;
  type?: "normal" | "portrait";
}) {
  const [isClicked, setIsClicked] = useState(false);
  const { setSidePanel } = useSidePanelContext();
  const handleCardClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    setSidePanel([<GameSidePanel key={game.id} game={game} />]);
  };
  return (
    <Suspense fallback={<SubGameCardSkeleton />}>
      <div
        className={(twMerge as (...args: string[]) => string)(
          "flex flex-col gap-2",
          className ?? "",
          type === "portrait" ? "max-w-36" : "",
        )}
      >
        <div
          className={(twMerge as (...args: string[]) => string)(
            "relative flex flex-col overflow-hidden rounded-lg bg-blue-500 shadow-sm transition-shadow hover:shadow-md",
            type === "portrait" ? "aspect-[9/14] h-52" : "aspect-[14/8] h-30",
            isClicked ? "scale-[0.98] transition-transform" : "",
          )}
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-2 px-2 py-1">
            <Image
              src={`/images/icons/platforms_logos/logo_${game.platform_ids[0]}_timed.svg`}
              alt={
                platformNames[
                  game.platform_ids[0] as keyof typeof platformNames
                ] ?? ""
              }
              width={16}
              height={16}
              className="h-4 w-auto"
            />
            <span className="line-clamp-1 text-sm font-medium text-ellipsis text-white">
              {
                platformNames[
                  game.platform_ids[0] as keyof typeof platformNames
                ]
              }
            </span>
          </div>
          <div className="relative aspect-[9/14] w-full overflow-hidden">
            <Image
              src={type === "portrait" ? game.cover_portrait : game.cover}
              alt={game.name}
              width={type === "portrait" ? 200 : 400}
              height={type === "portrait" ? 400 : 200}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <h3 className="line-clamp-2 text-sm text-ellipsis text-white">
          {game.name}
        </h3>
      </div>
    </Suspense>
  );
}
