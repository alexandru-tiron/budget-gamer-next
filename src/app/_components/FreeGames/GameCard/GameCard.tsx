"use client";

import type { FreeGame, SubscriptionGame } from "~/types/game";
import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { GameSidePanel } from "../../SidePanel/GameSidePanel";
import Countdown from "../../common/Countdown";
import {
  FALLBACK_COVER,
  hasRealEndDate,
  PLATFORM_NAMES,
  platformIcon,
  PROVIDER_NAMES,
  providerLogo,
} from "../../common/labels";

export default function GameCard({
  game,
  index = 0,
}: {
  game: FreeGame | SubscriptionGame;
  /** Position in the grid, used to stagger the entrance animation */
  index?: number;
}) {
  const { openSidePanel } = useSidePanelContext();
  const providerName = PROVIDER_NAMES[game.provider_id] ?? "Unknown";

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() =>
        openSidePanel(<GameSidePanel key={game.id} game={game} />, game.name)
      }
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      className="group animate-fade-up bg-surface hover:ring-accent/50 relative flex h-full w-full flex-col overflow-hidden rounded-2xl text-left ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgb(105_74_206_/_0.6)] focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.99]"
    >
      <span className="bg-surface-2 relative block aspect-video w-full overflow-hidden">
        <Image
          src={game.cover || FALLBACK_COVER}
          alt=""
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 28vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30"
        />

        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 py-1 pr-2.5 pl-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur-md">
          <Image
            src={providerLogo(game.provider_id)}
            alt=""
            width={16}
            height={16}
            className="h-4 w-auto"
          />
          {providerName}
        </span>
        {hasRealEndDate(game.provider_id) && (
          <Countdown
            end={game.end_date}
            className="absolute top-2.5 right-2.5"
          />
        )}

        <span className="from-accent-deep to-accent-strong absolute bottom-2.5 left-2.5 rounded-md bg-gradient-to-r px-2 py-0.5 text-xs font-bold tracking-wider text-white shadow-lg">
          FREE
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-3 p-4">
        <span className="line-clamp-2 text-base leading-snug font-semibold text-white">
          {game.name}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <span className="flex items-center gap-2" aria-label="Platforms">
            {game.platform_ids.slice(0, 4).map((platform) => (
              <Image
                key={platform}
                src={platformIcon(platform)}
                alt={PLATFORM_NAMES[platform] ?? platform}
                title={PLATFORM_NAMES[platform] ?? platform}
                width={14}
                height={14}
                className="h-3.5 w-auto opacity-70 brightness-0 invert"
              />
            ))}
          </span>
          <span
            aria-hidden="true"
            className="text-accent inline-flex translate-x-1 items-center gap-1 text-xs font-medium opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
          >
            View details
            <span className="text-sm">→</span>
          </span>
        </span>
      </span>
    </button>
  );
}
