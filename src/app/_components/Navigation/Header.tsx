"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
export default function Header() {
  const pathname = usePathname();
  let title: string;
  switch (pathname) {
    case "/":
      title = "Free Games";
      break;
    case "/timed":
      title = "Timed";
      break;
    case "/articles":
      title = "Articles";
      break;
    case "/settings":
      title = "Settings";
      break;
    default:
      title = "Free Games";
      break;
  }

  return (
    <header
      id="header"
      className="fixed top-0 right-0 left-0 z-100 flex h-16 justify-center bg-white p-4 shadow-sm dark:bg-[#1e1e1e]"
    >
      <h2 className="text-2xl font-medium text-white">{title}</h2>
      <Link
        href="/"
        className="absolute top-1/2 left-8 hidden -translate-y-1/2 items-center gap-1 text-white md:flex lg:left-84 lg:-translate-x-full"
      >
        <Image
          src="/images/icons/Color Favicon.svg"
          alt="Budget Gamer Logo"
          className="h-12 w-12"
          width={24}
          height={24}
        />
        <div className="flex">
          <p className="font-medium">Budget</p>
          <p className="font-light">Gamer</p>
        </div>
      </Link>
    </header>
  );
}
