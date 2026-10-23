import type { ReactNode } from "react";
import Image from "next/image";
import AboutPanel from "../_components/Settings/AboutPanel";
import TermsPanel from "../_components/Settings/TermsPanel";
import GDPRPanel from "../_components/Settings/GDPRPanel";
import OpenSourcePanel from "../_components/Settings/OpenSourcePanel";
import SharePanel from "../_components/Settings/SharePanel";
import SettingsPanelButton from "../_components/Settings/SettingsPanelButton";
import { PAGE_PADDING } from "../_components/common/layout";
import { PROVIDER_NAMES, providerLogo } from "../_components/common/labels";

const VERSION = "2.0.0";

// An item either opens a side panel or links to an external page
type SettingItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
} & ({ panel: ReactNode } | { href: string });

interface SettingSection {
  id: string;
  title: string;
  icon: string;
  items: SettingItem[];
}

const sections: SettingSection[] = [
  {
    id: "general",
    title: "General",
    icon: "/images/icons/settings_icons/general_icon.svg",
    items: [
      {
        id: "about",
        title: "About App",
        description: "What Budget Gamer does and where the deals come from",
        icon: "/images/icons/settings_icons/about_app_icon.svg",
        panel: <AboutPanel />,
      },
      {
        id: "share-repo",
        title: "Share Repository",
        description: "Send the project to a friend",
        icon: "/images/icons/settings_icons/share_app_icon.svg",
        panel: <SharePanel />,
      },
      {
        id: "discord",
        title: "Join our Discord",
        description: "Chat with other deal hunters",
        icon: "/images/icons/settings_icons/discord_icon.svg",
        href: "https://discord.gg/budgetgamer",
      },
      {
        id: "contact",
        title: "Contact Us",
        description: "Questions, ideas or a store we're missing",
        icon: "/images/icons/settings_icons/contact_us_icon.svg",
        href: "mailto:contact@budgetgamer.app",
      },
    ],
  },
  {
    id: "legal",
    title: "Legal information",
    icon: "/images/icons/settings_icons/legal_icon.svg",
    items: [
      {
        id: "terms",
        title: "Terms of Service",
        description: "The rules for using the app",
        icon: "/images/icons/settings_icons/terms_icon.svg",
        panel: <TermsPanel />,
      },
      {
        id: "gdpr",
        title: "GDPR",
        description: "How your data is handled",
        icon: "/images/icons/settings_icons/gdpr_icon.svg",
        panel: <GDPRPanel />,
      },
      {
        id: "open-source",
        title: "Open Source Licenses",
        description: "The libraries that make this possible",
        icon: "/images/icons/settings_icons/open_source_icon.svg",
        panel: <OpenSourcePanel />,
      },
    ],
  },
];

const STORES = [
  "steam",
  "epic_games",
  "gog",
  "amazon_games",
  "humble_bundle",
  "playstation",
  "xbox",
  "nintendo_eshop",
];

const itemClassName =
  "group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04]";

function ChevronIcon({ external }: { external: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`group-hover:text-accent size-4 shrink-0 text-gray-500 transition duration-300 ${
        external
          ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          : "group-hover:translate-x-1"
      }`}
    >
      <path
        fillRule="evenodd"
        d={
          external
            ? "M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
            : "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        }
        clipRule="evenodd"
      />
    </svg>
  );
}

function SettingRow({ item }: { item: SettingItem }) {
  const isLink = "href" in item;
  const isExternal = isLink && item.href.startsWith("http");
  const content = (
    <>
      <span className="bg-accent/10 ring-accent/20 group-hover:bg-accent/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition duration-300 group-hover:scale-105">
        <Image
          src={item.icon}
          alt=""
          className="h-5 w-5"
          width={20}
          height={20}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium text-white">{item.title}</span>
        <span className="truncate text-sm text-gray-400">
          {item.description}
        </span>
      </span>
      <ChevronIcon external={isLink} />
    </>
  );

  if (isLink) {
    return (
      <a
        href={item.href}
        className={itemClassName}
        {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {content}
        {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }

  return (
    <SettingsPanelButton
      title={item.title}
      panel={item.panel}
      className={itemClassName}
    >
      {content}
    </SettingsPanelButton>
  );
}

export default function Settings() {
  return (
    <div className={`flex h-full w-full flex-col gap-8 ${PAGE_PADDING}`}>
      <section
        aria-labelledby="settings-app"
        className="bg-surface animate-fade-up relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/5 md:p-8"
      >
        <div
          aria-hidden="true"
          className="bg-accent-strong/30 pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-accent-deep/25 pointer-events-none absolute -bottom-36 left-1/4 size-72 rounded-full blur-3xl"
        />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <span className="bg-page/60 flex size-20 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_48px_-8px_rgb(143_115_232_/_0.75)] ring-1 ring-white/10">
            <Image
              src="/images/icons/Color Favicon.svg"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14"
            />
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="flex items-center gap-2">
              <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">
                Budget Gamer
              </span>
              <span
                id="version"
                className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-300 ring-1 ring-white/10"
              >
                v{VERSION}
              </span>
            </p>
            <h2
              id="settings-app"
              className="text-2xl font-bold text-balance text-white md:text-3xl"
            >
              Every free game, one place
            </h2>
            <p className="max-w-xl text-sm text-gray-400 md:text-base">
              Giveaways and subscription games from the big stores, checked
              every day so you never miss one.
            </p>
            <ul
              aria-label="Stores we track"
              className="mt-3 flex flex-wrap gap-2"
            >
              {STORES.map((store) => (
                <li
                  key={store}
                  className="bg-page/50 flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1.5 text-xs font-medium text-gray-200 ring-1 ring-white/10"
                >
                  <Image
                    src={providerLogo(store)}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-auto max-w-5 object-contain"
                  />
                  {PROVIDER_NAMES[store]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* grid-cols-1 lets the columns shrink below the descriptions' full width */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {sections.map((section, index) => (
          <section
            key={section.id}
            aria-labelledby={`settings-${section.id}`}
            style={{ animationDelay: `${(index + 1) * 80}ms` }}
            className="animate-fade-up flex flex-col gap-3"
          >
            <h2
              id={`settings-${section.id}`}
              className="flex items-center gap-2 px-1 text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase"
            >
              <Image
                src={section.icon}
                alt=""
                className="h-4 w-4 opacity-70"
                width={16}
                height={16}
              />
              {section.title}
            </h2>
            <ul className="bg-surface divide-y divide-white/5 overflow-hidden rounded-2xl ring-1 ring-white/5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <SettingRow item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-auto flex flex-col items-center gap-1 pt-4 text-xs text-gray-500">
        <p className="flex items-center gap-1.5">
          Made with
          <Image
            src="/images/icons/settings_icons/heart.svg"
            alt="love"
            width={14}
            height={14}
            className="animate-pulse"
          />
          by
          <Image
            src="/images/icons/settings_icons/2m_logo.svg"
            alt="2M"
            width={16}
            height={16}
          />
        </p>
      </footer>
    </div>
  );
}
