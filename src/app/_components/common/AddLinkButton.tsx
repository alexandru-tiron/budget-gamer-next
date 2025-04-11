"use client";

import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import AddLinkSidePanel from "../SidePanel/AddLinkSidePanel";

export default function AddLinkButton({ type, handleSubmit }: { type: "game" | "article", handleSubmit: (link: string, type: "game" | "article") => void }) {
  const { setSidePanel } = useSidePanelContext();
  return (
    <button
      className="absolute right-6 bottom-22 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3196] via-[#7b36a3] via-[#773cb1] via-[#7243bf] to-[#694ace] p-2 lg:right-12 lg:bottom-12 lg:h-16 lg:w-16"
      onClick={() =>
        setSidePanel([
          <AddLinkSidePanel key="add-link-side-panel" type={type} handleSubmit={handleSubmit} />,
        ])
      }
    >
      <Image src="/images/icons/plus.svg" alt="Add" width={42} height={42} />
    </button>
  );
}
