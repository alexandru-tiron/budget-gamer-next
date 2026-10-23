"use client";
import Image from "next/image";
import { useId, useState, useTransition, type SubmitEvent } from "react";
import { submitLink, type SubmitLinkResult } from "~/app/_actions/submit-link";
import { providerLogo } from "../common/labels";
import { PanelBody, PanelCard, PanelHero } from "./PanelBlocks";
import SidePanelHeader from "./SidePanelHeader";

const SETTINGS_ICONS = "/images/icons/settings_icons";
const LINK_ICON = `${SETTINGS_ICONS}/link-45deg.svg`;

// What each kind of link is checked against, shown as chips under the form
const SOURCES = {
  game: [
    { name: "Steam", logo: providerLogo("steam") },
    { name: "GOG", logo: providerLogo("gog") },
    { name: "Humble Bundle", logo: providerLogo("humble_bundle") },
    { name: "PlayStation", logo: providerLogo("playstation") },
    { name: "Xbox", logo: providerLogo("xbox") },
    { name: "Nintendo eShop (Europe)", logo: providerLogo("nintendo_eshop") },
  ],
  article: [
    { name: "Twitter / X", logo: `${SETTINGS_ICONS}/twitter.svg` },
    { name: "Reddit", logo: `${SETTINGS_ICONS}/reddit.svg` },
    { name: "Humble Bundle", logo: providerLogo("humble_bundle") },
    { name: "Gleam", logo: LINK_ICON },
    { name: "Facebook", logo: `${SETTINGS_ICONS}/facebook.svg` },
  ],
};

const COPY = {
  game: {
    title: "Add a free game",
    eyebrow: "Found a freebie?",
    heading: "Share a 100% off game",
    intro:
      "If you find a game with 100% discount and want to share it with others, paste the store link below and we will add it automatically if it's free.",
    label: "Store page link",
    placeholder: "https://store.steampowered.com/app/…",
    steps: ["Paste the store link", "We check it's free", "Everyone sees it"],
    sourcesTitle: "We support games from",
  },
  article: {
    title: "Add an article link",
    eyebrow: "Found a giveaway?",
    heading: "Share a giveaway article",
    intro:
      "If you find a giveaway article and want to share it with others, paste the link below and we will add it automatically if it's valid.",
    label: "Giveaway article link",
    placeholder: "https://www.reddit.com/r/…",
    steps: ["Paste the link", "We check the site", "It shows in Articles"],
    sourcesTitle: "We support platforms like",
  },
};

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AddLinkSidePanel({
  type,
}: {
  type: "game" | "article";
}) {
  const [link, setLink] = useState("");
  const [result, setResult] = useState<SubmitLinkResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();
  const copy = COPY[type];

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const submitResult = await submitLink(link, type);
      setResult(submitResult);
      if (submitResult.ok) setLink("");
    });
  };

  return (
    <div className="flex flex-col text-white">
      <SidePanelHeader title={copy.title} />

      <PanelBody>
        <PanelHero icon={LINK_ICON} eyebrow={copy.eyebrow} title={copy.heading}>
          <p>{copy.intro}</p>
        </PanelHero>

        <ol className="animate-fade-up grid grid-cols-3 gap-2 [animation-delay:60ms]">
          {copy.steps.map((step, index) => (
            <li
              key={step}
              className="bg-surface flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center ring-1 ring-white/5"
            >
              <span className="from-accent-deep to-accent-strong flex size-7 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-[0_4px_14px_-4px_rgb(105_74_206_/_0.9)]">
                {index + 1}
              </span>
              <span className="text-xs leading-snug text-gray-300">{step}</span>
            </li>
          ))}
        </ol>

        <form
          className="bg-surface animate-fade-up flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-white/5 [animation-delay:120ms]"
          onSubmit={handleSubmit}
        >
          <label
            htmlFor={inputId}
            className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase"
          >
            {copy.label}
          </label>
          <div className="relative">
            <Image
              src={LINK_ICON}
              alt=""
              width={18}
              height={18}
              className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 opacity-60"
            />
            <input
              id={inputId}
              type="url"
              required
              placeholder={copy.placeholder}
              className="bg-page focus:ring-accent w-full rounded-xl py-3 pr-3 pl-10 text-sm text-white ring-1 ring-white/10 transition placeholder:text-gray-500 hover:ring-white/20 focus:ring-2 focus:outline-none disabled:opacity-60"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isPending}
            />
          </div>
          <button
            type="submit"
            className="from-accent-deep to-accent-strong flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgb(105_74_206_/_0.9)] transition hover:brightness-115 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner />
                Checking link…
              </>
            ) : (
              <>
                Submit link
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
          {isPending && type === "game" && (
            <p className="text-center text-xs text-gray-400">
              Checking the store page can take up to a minute.
            </p>
          )}
          {result && (
            <p
              role="status"
              className={`animate-pop-in flex items-start gap-2.5 rounded-xl p-3 text-sm ring-1 ${
                result.ok
                  ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/30"
                  : "bg-red-500/10 text-red-200 ring-red-400/30"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  result.ok ? "bg-emerald-500" : "bg-red-500"
                }`}
              >
                {result.ok ? "✓" : "!"}
              </span>
              {result.message}
            </p>
          )}
        </form>

        <PanelCard title={copy.sourcesTitle} delay={3}>
          <ul className="flex flex-wrap gap-2">
            {SOURCES[type].map((source) => (
              <li
                key={source.name}
                className="bg-page/60 flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1.5 text-xs font-medium text-gray-200 ring-1 ring-white/10"
              >
                <Image
                  src={source.logo}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-auto max-w-5 object-contain"
                />
                {source.name}
              </li>
            ))}
          </ul>
          {type === "game" && (
            <p className="flex items-center gap-2 text-xs text-gray-400">
              <Image
                src={providerLogo("epic_games")}
                alt=""
                width={16}
                height={16}
                className="h-4 w-auto"
              />
              Epic Games freebies are added automatically every week.
            </p>
          )}
        </PanelCard>

        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
          Thank you for your contribution!
          <Image
            src={`${SETTINGS_ICONS}/heart.svg`}
            alt=""
            width={12}
            height={12}
          />
        </p>
      </PanelBody>
    </div>
  );
}
