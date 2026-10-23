"use client";

import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import AddLinkSidePanel from "../SidePanel/AddLinkSidePanel";

export default function AddLinkButton({ type }: { type: "game" | "article" }) {
  const { openSidePanel } = useSidePanelContext();
  const label = type === "game" ? "Add a free game" : "Add an article link";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-haspopup="dialog"
      className="group animate-pop-in from-accent-deep to-accent-strong fixed right-6 bottom-24 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br p-2 shadow-[0_12px_30px_-8px_rgb(105_74_206_/_0.8)] ring-1 ring-white/10 transition duration-300 hover:scale-105 hover:shadow-[0_0_0_6px_rgb(143_115_232_/_0.2),0_14px_34px_-8px_rgb(105_74_206_/_0.9)] active:scale-95 lg:right-12 lg:bottom-12 lg:h-16 lg:w-16"
      onClick={() =>
        openSidePanel(
          <AddLinkSidePanel key="add-link-side-panel" type={type} />,
          label,
        )
      }
    >
      <Image
        src="/images/icons/plus.svg"
        alt=""
        width={42}
        height={42}
        className="transition duration-300 group-hover:rotate-90"
      />
    </button>
  );
}
