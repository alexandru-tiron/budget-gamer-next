"use client";

import type { FreeGame, SubscriptionGame } from "~/types/game";
import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { formatDate } from "../common/format";
import { useEffect, useState } from "react";
import Countdown from "../common/Countdown";
import {
  FALLBACK_COVER,
  hasRealEndDate,
  PLATFORM_NAMES,
  platformIcon,
  PROVIDER_NAMES,
  providerLogo,
  storeCallToAction,
} from "../common/labels";

export const GameSidePanel = ({
  game,
}: {
  game: FreeGame | SubscriptionGame;
}) => {
  const { closeSidePanel } = useSidePanelContext();
  const [copied, setCopied] = useState(false);
  const realEndDate = hasRealEndDate(game.provider_id);

  // Hide the "Copied" confirmation after 2 seconds
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(game.provider_url);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const details = [
    {
      label: "Free until",
      value: realEndDate && formatDate(game.end_date, true),
    },
    { label: "Developer", value: game.developer },
    { label: "Publisher", value: game.publisher },
    {
      label: "Release date",
      value: game.release_date && formatDate(game.release_date),
    },
  ].filter((detail) => detail.value);

  return (
    <div className="animate-fade-in flex flex-col text-white">
      <div className="bg-surface-2 relative aspect-video w-full shrink-0 overflow-hidden">
        <Image
          src={game.cover || FALLBACK_COVER}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 384px, (min-width: 640px) 416px, 100vw"
          className="animate-fade-in object-cover"
        />
        <div
          aria-hidden="true"
          className="from-page via-page/20 absolute inset-0 bg-gradient-to-t to-black/40"
        />
        <button
          type="button"
          aria-label="Close game details"
          className="absolute top-3 right-3 flex items-center justify-center rounded-full bg-black/60 p-1.5 ring-1 ring-white/15 backdrop-blur-md transition hover:rotate-90 hover:bg-black/80"
          onClick={closeSidePanel}
        >
          <Image src="/images/icons/x.svg" alt="" width={24} height={24} />
        </button>
      </div>

      <div className="relative -mt-6 flex flex-col gap-5 px-5 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-surface inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1.5 text-sm font-medium text-gray-200 ring-1 ring-white/10">
            <Image
              src={providerLogo(game.provider_id)}
              alt=""
              width={20}
              height={20}
              className="h-5 w-auto"
            />
            {PROVIDER_NAMES[game.provider_id] ?? "Unknown"}
          </span>
          {realEndDate && <Countdown end={game.end_date} />}
        </div>

        <h2 className="line-clamp-3 text-2xl leading-tight font-bold">
          {game.name}
        </h2>

        <ul
          aria-label="Platforms"
          className="flex flex-wrap items-center gap-2"
        >
          {game.platform_ids.map((platform) => (
            <li
              key={platform}
              className="bg-surface flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-white/5"
            >
              <Image
                src={platformIcon(platform)}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-auto brightness-0 invert"
              />
              <span className="line-clamp-1 text-sm text-ellipsis text-gray-200">
                {PLATFORM_NAMES[platform] ?? platform}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <a
            href={game.provider_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta from-accent-deep to-accent-strong flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-3 font-medium shadow-[0_10px_30px_-12px_rgb(105_74_206_/_0.9)] transition hover:brightness-115 active:scale-[0.98]"
          >
            {storeCallToAction(game.provider_id)}
            <span className="sr-only"> (opens in a new tab)</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4 transition group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
            >
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy link"
            className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium ring-1 transition active:scale-[0.97] min-[420px]:px-4 ${
              copied
                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
                : "bg-surface hover:bg-surface-2 text-gray-200 ring-white/10"
            }`}
          >
            {copied ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <Image
                src="/images/icons/link_icons/copy_link.svg"
                alt=""
                width={16}
                height={16}
                className="size-4"
              />
            )}
            <span
              aria-live="polite"
              className="sr-only min-[420px]:not-sr-only"
            >
              {copied ? "Copied!" : "Copy link"}
            </span>
          </button>
        </div>

        {game.description && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase">
              About
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">
              {game.description}
            </p>
          </div>
        )}

        {details.length > 0 && (
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/5">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="bg-surface flex flex-col gap-1 p-3 last:odd:col-span-2"
              >
                <dt className="text-xs text-gray-400">{detail.label}</dt>
                <dd
                  className="text-sm font-medium break-words text-gray-100"
                  suppressHydrationWarning
                >
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};
