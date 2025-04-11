import type { FreeGame, SubscriptionGame } from "~/types/game";
import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { format } from "date-fns";
import { useState } from "react";

const ProviderStrings = {
  steam: "Steam",
  epic_games: "Epic Games",
  amazon_games: "Amazon Games",
  gog: "GOG",
  origin: "Origin",
  battle: "Battle.net",
  humble_bundle: "Humble Bundle",
  playstation: "PlayStation Plus",
  none: "Unknown",
};
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

export const GameSidePanel = ({
  game,
}: {
  game: FreeGame | SubscriptionGame;
}) => {
  const { setSidePanel } = useSidePanelContext();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(game.provider_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <>
      <div className="flex flex-col text-white">
        <button
          className="absolute top-2 right-3 flex items-center justify-center rounded-full bg-[#1e1e1e] p-2"
          onClick={() => setSidePanel(null)}
        >
          <Image src="/images/icons/x.svg" alt="Close" width={24} height={24} />
        </button>
        <Image
          src={game.cover}
          alt={game.name}
          width={800}
          height={400}
          className="h-full w-full object-cover"
        />
        <div className="flex flex-col gap-4 p-4 md:p-8 lg:p-4">
          <h1 className="line-clamp-3 text-xl font-bold">{game.name}</h1>
          <div className="flex items-center gap-1">
            <Image
              src={`/images/icons/provider_logos/logo_${game.provider_id}.svg`}
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

          <div className="flex items-center gap-2">
            {game.platform_ids.map((platform) => (
              <div
                key={platform}
                className="flex items-center gap-2 rounded-full bg-[#1e1e1e] px-4 py-2"
              >
                <Image
                  src={`/images/icons/platforms_logos/logo_${platform}.svg`}
                  alt={
                    platformNames[platform as keyof typeof platformNames] ?? ""
                  }
                  width={16}
                  height={16}
                  className="h-4 w-auto"
                />
                <span className="line-clamp-1 text-sm text-ellipsis text-white">
                  {platformNames[platform as keyof typeof platformNames]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex w-full gap-1 overflow-hidden rounded-lg text-sm font-light text-white">
            <button
              onClick={handleCopyLink}
              className="relative flex flex-grow flex-col items-center gap-1 bg-[#1e1e1e] p-2 transition-colors hover:bg-[#2a2a2a]"
            >
              <Image
                src="/images/icons/link_icons/copy_link.svg"
                alt="Copy link"
                width={20}
                height={20}
              />
              <span>{copied ? "Copied!" : "Copy link"}</span>
              {copied && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-[#684ace] px-2 py-1 text-xs">
                  Copied!
                </div>
              )}
            </button>
            <a
              href={game.provider_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-grow flex-col items-center gap-1 bg-[#1e1e1e] p-2 transition-colors hover:bg-[#2a2a2a]"
            >
              <Image
                src="/images/icons/link_icons/open_link.svg"
                alt="Open link"
                width={20}
                height={20}
              />
              <span>Open link</span>
            </a>
          </div>
          <div className="flex flex-col gap-1 overflow-hidden rounded-lg">
            <div className="flex flex-col gap-1 bg-[#1e1e1e] p-3">
              <h3 className="text-base font-medium">Free until: </h3>
              <span className="text-sm font-light text-gray-300">
                {format(game.end_date, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#1e1e1e] p-3">
              <h3 className="text-base font-medium">Description: </h3>
              <p className="text-sm font-light text-gray-300">
                {game.description}
              </p>
            </div>
            <div className="flex flex-col gap-1 bg-[#1e1e1e] p-3">
              <h3 className="text-base font-medium">Developer: </h3>
              <p className="text-sm font-light text-gray-300">
                {game.developer}
              </p>
            </div>
            <div className="flex flex-col gap-1 bg-[#1e1e1e] p-3">
              <h3 className="text-base font-medium">Publisher: </h3>
              <p className="text-sm font-light text-gray-300">
                {game.publisher}
              </p>
            </div>
            {game.release_date && (
              <div className="flex flex-col gap-1 bg-[#1e1e1e] p-3">
                <h3 className="text-base font-medium">Release date: </h3>
                <span className="text-sm font-light text-gray-300">
                  {format(game.release_date, "dd/MM/yyyy ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
