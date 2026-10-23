"use client";

import type { ReactNode } from "react";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";

/**
 * Opens `panel` in the side panel. The settings page stays a server component, so the panels'
 * long static texts arrive as rendered HTML instead of client JavaScript.
 */
export default function SettingsPanelButton({
  title,
  panel,
  className,
  children,
}: {
  title: string;
  panel: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { openSidePanel } = useSidePanelContext();

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className={className}
      onClick={() => openSidePanel(panel, title)}
    >
      {children}
    </button>
  );
}
