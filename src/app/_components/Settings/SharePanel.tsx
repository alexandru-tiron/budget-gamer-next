"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import SidePanelHeader from "../SidePanel/SidePanelHeader";
import { PanelBody, PanelHero } from "../SidePanel/PanelBlocks";

const REPO_URL = "https://github.com/alexandru-tiron/budget-gamer-next";
const SHARE_TEXT =
  "Check out Budget Gamer - A web app to find free games across multiple platforms!";

const SHARE_LINKS = [
  {
    name: "Twitter",
    icon: "/images/icons/settings_icons/twitter.svg",
    color: "#1C93E4",
    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(REPO_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
  },
  {
    name: "Facebook",
    icon: "/images/icons/settings_icons/facebook.svg",
    color: "#1771E6",
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(REPO_URL)}`,
  },
  {
    name: "Reddit",
    icon: "/images/icons/settings_icons/reddit.svg",
    color: "#FF4500",
    href: `https://reddit.com/submit?url=${encodeURIComponent(REPO_URL)}&title=${encodeURIComponent("Budget Gamer - Find free games across multiple platforms")}`,
  },
  {
    name: "WhatsApp",
    icon: "/images/icons/settings_icons/whatsapp.svg",
    color: "#25D366",
    href: `https://wa.me/?text=${encodeURIComponent(`Check out Budget Gamer: ${REPO_URL}`)}`,
  },
];

// Whether the browser has a system share sheet never changes, so there is nothing to subscribe to
const subscribeToNothing = () => () => undefined;

export default function SharePanel() {
  const [copied, setCopied] = useState(false);
  // Only offer the system share sheet where the browser has one. The server renders without it
  // so hydration matches.
  const canShare = useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false,
  );

  // Hide the "Copied" confirmation after 2 seconds
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(REPO_URL);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Budget Gamer",
        text: SHARE_TEXT,
        url: REPO_URL,
      });
    } catch {
      // Closing the share sheet rejects too, so there is nothing to report
    }
  };

  return (
    <>
      <SidePanelHeader title="Share Repository" />
      <PanelBody>
        <PanelHero
          icon="/images/icons/settings_icons/share_app_icon.svg"
          eyebrow="Spread the word"
          title="Share Budget Gamer"
        >
          <p>Share Budget Gamer with your friends and help us grow!</p>
        </PanelHero>

        <div className="bg-surface animate-fade-up flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-white/5 [animation-delay:60ms]">
          <p className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase">
            Repository link
          </p>
          <div className="bg-page flex items-center gap-2 rounded-xl p-1.5 pl-3 ring-1 ring-white/10">
            <Image
              src="/images/icons/settings_icons/link-45deg.svg"
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0 opacity-60"
            />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-300">
              {REPO_URL.replace("https://", "")}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition active:scale-95 ${
                copied
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "from-accent-deep to-accent-strong bg-gradient-to-r text-white hover:brightness-115"
              }`}
            >
              <span aria-live="polite">
                {copied ? (
                  "Copied!"
                ) : (
                  <>
                    Copy<span className="sr-only"> repository link</span>
                  </>
                )}
              </span>
            </button>
          </div>
          {canShare && (
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <Image
                src="/images/icons/settings_icons/share_app_icon.svg"
                alt=""
                width={16}
                height={16}
                className="size-4"
              />
              Share via…
            </button>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {SHARE_LINKS.map((link, index) => (
            <li
              key={link.name}
              style={{ animationDelay: `${(index + 2) * 60}ms` }}
              className="animate-fade-up"
            >
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-surface flex flex-col items-center gap-2 rounded-2xl p-4 text-center ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:ring-white/20"
              >
                <span
                  style={{
                    backgroundColor: `${link.color}26`,
                    boxShadow: `0 0 0 1px ${link.color}55`,
                  }}
                  className="flex size-12 items-center justify-center rounded-full transition duration-300 group-hover:scale-110"
                >
                  <Image
                    src={link.icon}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6"
                  />
                </span>
                <span className="text-sm font-medium text-white">
                  Share on {link.name}
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-surface animate-fade-up flex items-center gap-3 rounded-2xl p-4 ring-1 ring-white/5 transition [animation-delay:360ms] hover:ring-white/20"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-6 shrink-0 text-white"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-white">
              Star it on GitHub
            </span>
            <span className="text-xs text-gray-400">
              Browse the code or open an issue
            </span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="group-hover:text-accent size-4 shrink-0 text-gray-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            <path
              fillRule="evenodd"
              d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </PanelBody>
    </>
  );
}
