"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";
import type { FreeGame } from "~/types/game";
import GameCard from "./GameCard/GameCard";
import StatusMessage from "../common/StatusMessage";
import { CARD_GRID } from "../common/layout";
import { PROVIDER_NAMES, providerLogo } from "../common/labels";

type Sort = "ending" | "newest" | "name";

const SORTS: Record<
  Sort,
  { label: string; compare: (a: FreeGame, b: FreeGame) => number }
> = {
  ending: {
    label: "Ending soon",
    compare: (a, b) => a.end_date.getTime() - b.end_date.getTime(),
  },
  newest: {
    label: "Newest",
    compare: (a, b) => b.start_date.getTime() - a.start_date.getTime(),
  },
  name: { label: "A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
};

const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "from-accent-deep to-accent-strong bg-gradient-to-r text-white shadow-[0_6px_18px_-8px_rgb(105_74_206_/_0.9)]"
          : "bg-surface hover:bg-surface-2 text-gray-300 ring-1 ring-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Free games with store filters, search and sorting, all applied in the browser.
 */
export default function FreeGamesBrowser({ games }: { games: FreeGame[] }) {
  const [query, setQuery] = useState("");
  const [store, setStore] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("ending");
  const searchId = useId();
  const sortId = useId();

  const stores = useMemo(() => {
    const counts = new Map<string, number>();
    for (const game of games) {
      counts.set(game.provider_id, (counts.get(game.provider_id) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [games]);

  const visible = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return games
      .filter((game) => store === null || game.provider_id === store)
      .filter((game) => {
        const haystack = normalize(
          `${game.name} ${game.developer} ${game.publisher ?? ""}`,
        );
        return words.every((word) => haystack.includes(word));
      })
      .sort(SORTS[sort].compare);
  }, [games, query, store, sort]);

  const clearFilters = () => {
    setQuery("");
    setStore(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter by store"
          className="flex flex-wrap gap-2"
        >
          <FilterChip active={store === null} onClick={() => setStore(null)}>
            All
            <span className="rounded-full bg-white/15 px-1.5 text-xs">
              {games.length}
            </span>
          </FilterChip>
          {stores.map(([providerId, count]) => (
            <FilterChip
              key={providerId}
              active={store === providerId}
              onClick={() =>
                setStore((current) =>
                  current === providerId ? null : providerId,
                )
              }
            >
              <Image
                src={providerLogo(providerId)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-auto"
              />
              {PROVIDER_NAMES[providerId] ?? providerId}
              <span className="rounded-full bg-white/15 px-1.5 text-xs">
                {count}
              </span>
            </FilterChip>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-64 lg:flex-none">
            <label htmlFor={searchId} className="sr-only">
              Search free games
            </label>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 3.16 10.002l3.169 3.17a.75.75 0 1 0 1.06-1.061l-3.168-3.17A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              className="bg-surface focus:ring-accent w-full rounded-full py-2 pr-4 pl-9 text-sm text-white ring-1 ring-white/10 transition placeholder:text-gray-500 hover:ring-white/20 focus:outline-none"
            />
          </div>
          <label htmlFor={sortId} className="sr-only">
            Sort games
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="bg-surface focus:ring-accent cursor-pointer rounded-full px-4 py-2 text-sm text-white ring-1 ring-white/10 transition hover:ring-white/20 focus:outline-none"
          >
            {Object.entries(SORTS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length === 1
          ? "1 game shown"
          : `${visible.length} games shown`}
      </p>

      {visible.length === 0 ? (
        <StatusMessage
          title="No games match"
          description="Try another store or a different search."
        >
          <button
            type="button"
            onClick={clearFilters}
            className="from-accent-deep to-accent-strong rounded-full bg-gradient-to-r px-5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Clear filters
          </button>
        </StatusMessage>
      ) : (
        <ul className={CARD_GRID}>
          {visible.map((game, index) => (
            <li key={game.id}>
              <GameCard game={game} index={index} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
