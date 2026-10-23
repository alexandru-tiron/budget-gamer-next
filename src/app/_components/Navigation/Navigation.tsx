"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/timed", label: "Timed", icon: "calendar" },
  { href: "/articles", label: "Articles", icon: "articles" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

// The articles icons use an underscore instead of a hyphen
const iconSrc = (icon: string, selected: boolean) =>
  `/images/icons/${icon}${icon === "articles" ? "_" : "-"}${selected ? "selected" : "unselected"}.svg`;

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="bg-surface/85 fixed right-0 bottom-0 left-0 z-20 border-t border-white/5 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:top-16 lg:right-auto lg:bottom-auto lg:left-48 lg:h-full lg:w-36 lg:border-t-0 lg:bg-transparent lg:bg-gradient-to-r lg:from-transparent lg:from-60% lg:to-[#1e1e1e80] lg:to-100% lg:pb-0 lg:backdrop-blur-none"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around py-1 lg:flex-col lg:gap-1 lg:px-2 lg:pt-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="lg:w-full">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex flex-col items-center rounded-xl px-3 py-1.5 transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5 ${
                  isActive
                    ? "lg:bg-accent/15 lg:ring-accent/25 lg:ring-1"
                    : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition duration-300 lg:h-6 lg:w-6 ${
                    isActive ? "bg-accent/20 lg:bg-transparent" : ""
                  }`}
                >
                  <Image
                    src={iconSrc(item.icon, isActive)}
                    alt=""
                    className="h-5 w-5 transition duration-300 group-hover:scale-110"
                    width={20}
                    height={20}
                  />
                </span>
                <span
                  className={`mt-1 text-xs transition-colors lg:mt-0 lg:text-lg lg:font-medium ${
                    isActive
                      ? "text-accent font-medium"
                      : "text-gray-400 group-hover:text-gray-200"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
