"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Free Games",
  "/timed": "Timed",
  "/articles": "Articles",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Free Games";

  return (
    <header
      id="header"
      className="bg-surface/80 fixed top-0 right-0 left-0 z-100 flex h-16 items-center justify-center border-b border-white/5 px-4 backdrop-blur-lg"
    >
      <a
        href="#main-content"
        className="bg-accent-strong sr-only rounded-lg px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <h1 className="text-2xl font-medium text-white">{title}</h1>
      <Link
        href="/"
        aria-label="Budget Gamer home"
        className="group absolute top-1/2 left-8 hidden -translate-y-1/2 items-center gap-1 text-white md:flex lg:left-84 lg:-translate-x-full"
      >
        <Image
          src="/images/icons/Color Favicon.svg"
          alt=""
          className="h-12 w-12 transition duration-300 group-hover:scale-110 group-hover:-rotate-12"
          width={24}
          height={24}
        />
        <span className="flex">
          <span className="font-medium">Budget</span>
          <span className="font-light">Gamer</span>
        </span>
      </Link>
    </header>
  );
}
