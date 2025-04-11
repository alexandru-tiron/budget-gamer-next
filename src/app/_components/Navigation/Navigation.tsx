"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-20 bg-[#1e1e1e] shadow-[0_-1px_2px_rgba(0,0,0,0.05)] lg:w-36 lg:top-16 lg:right-auto lg:bottom-auto lg:left-48 lg:h-full lg:bg-transparent lg:bg-gradient-to-r lg:from-[#00000000] lg:from-60% lg:to-[#1e1e1e80] lg:to-100%">
      <ul className="mx-auto flex max-w-md items-center justify-around lg:flex-col">
        <li>
          <Link
            href="/"
            className="flex flex-col items-center px-4 py-3 lg:mt-16 lg:flex-row lg:items-center lg:justify-center lg:gap-2"
          >
            <span className="icon flex h-6 w-6 items-center justify-center">
              <Image
                src={
                  pathname === "/"
                    ? "/images/icons/home-selected.svg"
                    : "/images/icons/home-unselected.svg"
                }
                alt="Home"
                className="h-5 w-5"
                width={20}
                height={20}
              />
            </span>
            <span
              className={`mt-1 text-xs lg:text-lg lg:font-medium ${pathname === "/" ? "text-[#684ace]" : "text-gray-600 dark:text-gray-400"}`}
            >
              Home
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/timed"
            className="flex flex-col items-center px-4 py-3 lg:flex-row lg:items-center lg:justify-center lg:gap-2"
          >
            <span className="icon flex h-6 w-6 items-center justify-center">
              <Image
                src={
                  pathname === "/timed"
                    ? "/images/icons/calendar-selected.svg"
                    : "/images/icons/calendar-unselected.svg"
                }
                alt="Timed"
                className="h-5 w-5"
                width={20}
                height={20}
              />
            </span>
            <span
              className={`mt-1 text-xs lg:text-lg lg:font-medium${pathname === "/timed" ? "font-medium text-[#684ace]" : "text-gray-600 dark:text-gray-400"}`}
            >
              Timed
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/articles"
            className="flex flex-col items-center px-4 py-3 lg:flex-row lg:items-center lg:justify-center lg:gap-2"
          >
            <span className="icon flex h-6 w-6 items-center justify-center">
              <Image
                src={
                  pathname === "/articles"
                    ? "/images/icons/articles_selected.svg"
                    : "/images/icons/articles_unselected.svg"
                }
                alt="Articles"
                className="h-5 w-5"
                width={20}
                height={20}
              />
            </span>
            <span
              className={`mt-1 text-xs lg:text-lg lg:font-medium ${pathname === "/articles" ? "font-medium text-[#684ace]" : "text-gray-600 dark:text-gray-400"}`}
            >
              Articles
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings"
            className="flex flex-col items-center px-4 py-3 lg:flex-row lg:items-center lg:justify-center lg:gap-2"
          >
            <span className="icon flex h-6 w-6 items-center justify-center">
              <Image
                src={
                  pathname === "/settings"
                    ? "/images/icons/settings-selected.svg"
                    : "/images/icons/settings-unselected.svg"
                }
                alt="Settings"
                className="h-5 w-5"
                width={20}
                height={20}
              />
            </span>
            <span
              className={`mt-1 text-xs lg:text-lg lg:font-medium ${pathname === "/settings" ? "font-medium text-[#684ace]" : "text-gray-600 dark:text-gray-400"}`}
            >
              Settings
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
