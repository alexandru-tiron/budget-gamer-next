"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

function ArrowButton({
  direction,
  label,
  onClick,
}: {
  direction: "back" | "forward";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`hover:bg-accent-strong absolute top-[40%] z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-lg ring-1 ring-white/15 backdrop-blur-md transition group-hover/row:opacity-100 hover:scale-105 focus-visible:opacity-100 md:flex ${
        direction === "back" ? "left-1" : "right-1"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5"
      >
        <path
          fillRule="evenodd"
          d={
            direction === "back"
              ? "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              : "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
          }
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

/**
 * A horizontally scrolling list with snap points, faded edges and arrow buttons that appear
 * on hover (and on keyboard focus) when there's more to see.
 */
export default function ScrollRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setCanGoBack(list.scrollLeft > 4);
    setCanGoForward(list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    update();
    list?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      list?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (direction: 1 | -1) => {
    const list = listRef.current;
    list?.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  // Only fade an edge when there is more content past it
  const mask = `linear-gradient(to right, ${canGoBack ? "transparent, black 2rem" : "black, black"}, ${
    canGoForward ? "black calc(100% - 4rem), transparent" : "black"
  })`;

  return (
    <div className="group/row relative">
      <ul
        ref={listRef}
        aria-label={label}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pt-2 pb-4"
      >
        {children}
      </ul>
      {canGoBack && (
        <ArrowButton
          direction="back"
          label={`Scroll ${label} back`}
          onClick={() => scroll(-1)}
        />
      )}
      {canGoForward && (
        <ArrowButton
          direction="forward"
          label={`Scroll ${label} forward`}
          onClick={() => scroll(1)}
        />
      )}
    </div>
  );
}
