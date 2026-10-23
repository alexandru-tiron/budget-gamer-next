import type { SubscriptionGame } from "~/types/game";
import SubGameCard from "./SubGameCard.tsx/SubGameCard";
import Image from "next/image";
import ScrollRow from "../common/ScrollRow";
import { providerLogo } from "../common/labels";

const SERVICES: Record<string, { name: string; description: string }> = {
  amazon_games: {
    name: "Amazon Games",
    description: "Free with Prime Gaming this month",
  },
  humble_bundle: {
    name: "Humble Bundle",
    description: "This month's Humble Choice games",
  },
  playstation: {
    name: "PlayStation Plus",
    description: "This month's PlayStation Plus games",
  },
  xbox_game_pass: {
    name: "Xbox Game Pass",
    description: "Recently added to Game Pass",
  },
  xbox_free_play_days: {
    name: "Xbox Free Play Days",
    description: "Play the full games free this weekend",
  },
  nintendo_switch_online: {
    name: "Nintendo Switch Online Game Trials",
    description: "Members can play the full game free for a limited time",
  },
};

export default function SubcriptionGameList({
  games,
  provider,
  type,
}: {
  games: SubscriptionGame[];
  provider: string;
  type?: "normal" | "portrait";
}) {
  const headingId = `subscription-${provider}`;
  const service = SERVICES[provider] ?? { name: provider, description: "" };

  return games.length === 0 ? null : (
    <section
      aria-labelledby={headingId}
      className="animate-fade-up flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-surface flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10">
            <Image
              src={providerLogo(provider)}
              alt=""
              width={24}
              height={24}
              className="h-6 w-auto max-w-8 object-contain"
            />
          </span>
          <div>
            <h2
              id={headingId}
              className="text-xl font-bold text-white md:text-2xl"
            >
              {service.name}
            </h2>
            <p className="text-sm text-gray-400">{service.description}</p>
          </div>
        </div>
        <span className="bg-surface shrink-0 rounded-full px-3 py-1 text-xs font-medium text-gray-300 ring-1 ring-white/10">
          {games.length === 1 ? "1 game" : `${games.length} games`}
        </span>
      </div>
      <ScrollRow label={service.name}>
        {games.map((game, index) => (
          <li key={game.id} className="shrink-0 snap-start">
            <SubGameCard game={game} type={type} index={index} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
