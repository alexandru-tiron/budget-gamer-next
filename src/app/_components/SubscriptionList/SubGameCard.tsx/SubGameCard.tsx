"use client";

import type { SubscriptionGame } from "~/types/game";
import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { GameSidePanel } from "~/app/_components/SidePanel/GameSidePanel";
import Countdown from "../../common/Countdown";
import {
  FALLBACK_COVER,
  hasRealEndDate,
  PLATFORM_NAMES,
  platformIcon,
} from "../../common/labels";

export default function SubGameCard({
  game,
  type,
  index = 0,
}: {
  game: SubscriptionGame;
  type?: "normal" | "portrait";
  /** Position in the row, used to stagger the entrance animation */
  index?: number;
}) {
  const { openSidePanel } = useSidePanelContext();
  const portrait = type === "portrait";
  const platform = game.platform_ids[0];
  const cover = (portrait ? game.cover_portrait : game.cover) || FALLBACK_COVER;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() =>
        openSidePanel(<GameSidePanel key={game.id} game={game} />, game.name)
      }
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      className={`group animate-fade-up flex flex-col gap-2.5 text-left ${
        portrait ? "w-36 sm:w-40" : "w-64 sm:w-72"
      }`}
    >
      <span
        className={`bg-surface-2 group-hover:ring-accent/50 relative block w-full overflow-hidden rounded-xl ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-14px_rgb(105_74_206_/_0.65)] group-focus-visible:-translate-y-1 group-active:scale-[0.98] ${
          portrait ? "aspect-[2/3]" : "aspect-video"
        }`}
      >
        <Image
          src={cover}
          alt=""
          fill
          sizes={portrait ? "160px" : "288px"}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40"
        />
        {platform && (
          <span className="absolute top-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur-md">
            <Image
              src={platformIcon(platform)}
              alt=""
              width={12}
              height={12}
              className="h-3 w-auto shrink-0 brightness-0 invert"
            />
            <span className="truncate">
              {PLATFORM_NAMES[platform] ?? platform}
            </span>
          </span>
        )}
        {hasRealEndDate(game.provider_id) && (
          <Countdown
            end={game.end_date}
            className="absolute right-2 bottom-2"
          />
        )}
      </span>
      <span className="line-clamp-2 text-sm leading-snug font-medium text-gray-200 transition group-hover:text-white">
        {game.name}
      </span>
    </button>
  );
}
