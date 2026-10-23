"use client";

import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";

export default function SidePanelHeader({ title }: { title: string }) {
  const { closeSidePanel } = useSidePanelContext();
  return (
    <div className="bg-page/85 sticky top-0 z-10 flex w-full items-center justify-between text-white backdrop-blur-xl">
      <h2 className="w-full px-14 py-5 text-center text-lg font-semibold">
        {title}
      </h2>
      {/* Same soft accent line as the page header */}
      <span
        aria-hidden="true"
        className="via-accent/50 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
      <button
        type="button"
        aria-label="Close panel"
        className="bg-surface hover:bg-surface-2 absolute top-1/2 left-3 flex -translate-y-1/2 items-center justify-center rounded-full p-1 ring-1 ring-white/10 transition hover:-translate-x-0.5 hover:-translate-y-1/2"
        onClick={closeSidePanel}
      >
        <Image
          src="/images/icons/arrow-left-short.svg"
          alt=""
          width={32}
          height={32}
        />
      </button>
    </div>
  );
}
