import type { SubscriptionGame } from "~/types/game";
import SubGameCard from "./SubGameCard.tsx/SubGameCard";
import Image from "next/image";
const providerNames = {
  amazon_games: "Amazon Games",
  humble_bundle: "Humble Bundle",
  playstation: "PlayStation Plus",
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
  return games.length === 0 ? null : (
    <div className="flex flex-col gap-4 mb-4 lg:px-8">
      <div className="flex items-center gap-2">
        <Image
          src={`/images/icons/provider_logos/logo_${provider}_black.svg`}
          alt={provider}
          width={16}
          height={16}
          className="h-5 w-auto"
        />
        <h2 className="text-2xl font-bold text-white">
          {providerNames[provider as keyof typeof providerNames]}
        </h2>
      </div>
      <div className="scrollbar-horizontal-styled flex w-full gap-4 overflow-x-auto pb-2 lg:px-4">
        {games.map((game) => (
          <SubGameCard key={game.id} game={game} type={type} />
        ))}
      </div>
    </div>
  );
}
