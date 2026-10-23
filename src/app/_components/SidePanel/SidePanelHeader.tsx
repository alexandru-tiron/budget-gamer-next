"use client";

import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";

export default function SidePanelHeader({ title }: { title: string }) {
  const { closeSidePanel } = useSidePanelContext();
  return (
    <div className="bg-page/85 sticky top-0 z-10 flex w-full items-center justify-between border-b border-white/5 text-white backdrop-blur-md">
      <h2 className="w-full px-14 py-5 text-center text-xl font-bold">
        {title}
      </h2>
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
