"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { CSSProperties } from "react";
import { PROVIDER_NAMES, providerLogo } from "../common/labels";

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/timed", label: "Timed", icon: "calendar" },
  { href: "/articles", label: "Articles", icon: "articles" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

// The articles icons use an underscore instead of a hyphen
export const iconSrc = (icon: string, selected: boolean) =>
  `/images/icons/${icon}${icon === "articles" ? "_" : "-"}${selected ? "selected" : "unselected"}.svg`;

// Shown on large screens under the links, as a reminder of what the app covers
const TRACKED_STORES = [
  "steam",
  "epic_games",
  "gog",
  "amazon_games",
  "humble_bundle",
  "playstation",
  "xbox",
  "nintendo_eshop",
];

export default function Navigation() {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:inset-x-auto lg:top-24 lg:bottom-auto lg:left-12 lg:w-64 lg:px-0 lg:pb-0"
    >
      <div className="bg-surface/85 relative mx-auto max-w-md rounded-2xl p-1.5 shadow-[0_12px_40px_-12px_rgb(0_0_0_/_0.8)] ring-1 ring-white/10 backdrop-blur-xl lg:max-w-none lg:p-2">
        {/* One highlight slides to the active link instead of each link lighting up */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            style={{ "--active": activeIndex } as CSSProperties}
            className="from-accent-deep/35 to-accent-strong/35 ring-accent/40 absolute inset-y-1.5 left-1.5 w-[calc((100%_-_0.75rem)/4)] translate-x-[calc(var(--active)*100%)] rounded-xl bg-gradient-to-br ring-1 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:inset-x-2 lg:top-2 lg:bottom-auto lg:h-12 lg:w-auto lg:translate-x-0 lg:translate-y-[calc(var(--active)*(100%_+_0.25rem))]"
          />
        )}
        <ul className="relative grid grid-cols-4 lg:grid-cols-1 lg:gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="group flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors hover:bg-white/5 lg:h-12 lg:flex-row lg:gap-3 lg:px-4 lg:py-0"
                >
                  <Image
                    src={iconSrc(item.icon, isActive)}
                    alt=""
                    className={`h-5 w-5 transition duration-300 group-hover:scale-110 ${isActive ? "scale-110" : "opacity-80"}`}
                    width={20}
                    height={20}
                  />
                  <span
                    className={`text-xs transition-colors lg:text-base ${
                      isActive
                        ? "font-semibold text-white"
                        : "font-medium text-gray-400 group-hover:text-gray-200"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 hidden rounded-2xl p-4 ring-1 ring-white/5 lg:block">
        <p className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
          Checked every day
        </p>
        <ul
          aria-label="Stores we track"
          className="mt-3 grid grid-cols-4 gap-2"
        >
          {TRACKED_STORES.map((store) => (
            <li
              key={store}
              title={PROVIDER_NAMES[store]}
              className="bg-surface/70 hover:bg-surface-2 flex aspect-square items-center justify-center rounded-xl ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:ring-white/15"
            >
              <Image
                src={providerLogo(store)}
                alt={PROVIDER_NAMES[store] ?? store}
                width={22}
                height={22}
                className="h-5.5 w-auto max-w-7 object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
