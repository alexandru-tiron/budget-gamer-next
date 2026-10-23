"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { iconSrc, NAV_ITEMS } from "./Navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Free Games",
  "/timed": "Timed",
  "/articles": "Articles",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Free Games";
  const icon = NAV_ITEMS.find((item) => item.href === pathname)?.icon;

  return (
    <header
      id="header"
      className="bg-page/75 fixed top-0 right-0 left-0 z-100 flex h-16 items-center justify-center px-4 backdrop-blur-xl"
    >
      <a
        href="#main-content"
        className="bg-accent-strong sr-only rounded-lg px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10"
      >
        Skip to content
      </a>

      <Link
        href="/"
        aria-label="Budget Gamer home"
        className="group absolute top-1/2 left-4 flex -translate-y-1/2 items-center gap-2 text-white lg:left-12"
      >
        <Image
          src="/images/icons/Color Favicon.svg"
          alt=""
          className="h-9 w-9 drop-shadow-[0_0_12px_rgb(143_115_232_/_0.55)] transition duration-300 group-hover:scale-110 group-hover:-rotate-12 md:h-11 md:w-11"
          width={44}
          height={44}
          priority
        />
        <span className="hidden text-lg md:flex">
          <span className="font-bold">Budget</span>
          <span className="text-accent font-light">Gamer</span>
        </span>
      </Link>

      {/* Keyed by page so the title animates in on every navigation */}
      <h1
        key={pathname}
        className="animate-fade-in flex items-center gap-2.5 text-xl font-semibold text-white md:text-2xl"
      >
        {icon && (
          <span className="bg-accent/15 ring-accent/30 flex size-8 items-center justify-center rounded-lg ring-1">
            <Image
              src={iconSrc(icon, true)}
              alt=""
              width={18}
              height={18}
              className="h-4.5 w-4.5"
            />
          </span>
        )}
        {title}
      </h1>

      {/* A soft accent line instead of a flat border */}
      <span
        aria-hidden="true"
        className="via-accent/50 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
    </header>
  );
}
