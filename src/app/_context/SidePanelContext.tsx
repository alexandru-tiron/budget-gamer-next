"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode, FC } from "react";
import { usePathname } from "next/navigation";

interface SidePanelContextProps {
  /** Show `content` in the side panel; `label` names the panel for screen readers. */
  openSidePanel: (content: ReactNode, label: string) => void;
  closeSidePanel: () => void;
}

interface SidePanelProviderProps {
  children: ReactNode;
}

interface SidePanelState {
  id: number;
  content: ReactNode;
  label: string;
}

const SidePanelContext = createContext<SidePanelContextProps | null>(null);

export const SidePanelProvider: FC<SidePanelProviderProps> = ({ children }) => {
  const [sidePanel, setSidePanel] = useState<SidePanelState | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Close the panel when navigating to another page
  if (currentPath !== pathname) {
    setCurrentPath(pathname);
    setSidePanel(null);
  }

  const openSidePanel = useCallback((content: ReactNode, label: string) => {
    if (document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement;
    }
    setSidePanel((previous) => ({
      id: (previous?.id ?? 0) + 1,
      content,
      label,
    }));
  }, []);

  const closeSidePanel = useCallback(() => setSidePanel(null), []);

  // Move focus into the panel when it opens, and back to what opened it when it closes
  const panelId = sidePanel?.id ?? null;
  useEffect(() => {
    if (panelId !== null) {
      panelRef.current?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus();
      returnFocusRef.current = null;
    }
  }, [panelId]);

  // Escape closes the panel
  useEffect(() => {
    if (panelId === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidePanel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panelId, closeSidePanel]);

  const sidePanelState = useMemo(
    () => ({ openSidePanel, closeSidePanel }),
    [openSidePanel, closeSidePanel],
  );

  return (
    <SidePanelContext.Provider value={sidePanelState}>
      {children}
      {sidePanel && (
        <>
          {/* Dims the page on tablets; on large screens the page stays usable beside the panel */}
          <div
            aria-hidden="true"
            onClick={closeSidePanel}
            className="animate-fade-in fixed inset-0 z-105 bg-black/60 backdrop-blur-[2px] lg:hidden"
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-label={sidePanel.label}
            tabIndex={-1}
            className="scrollbar-vertical-styled animate-slide-in-right bg-page fixed top-0 right-0 z-110 h-[100dvh] max-h-[100dvh] w-full overflow-y-auto border-l border-white/5 shadow-[-24px_0_48px_-16px_rgb(0_0_0_/_0.7)] focus:outline-none sm:w-[26rem] lg:w-96"
          >
            {sidePanel.content}
          </aside>
        </>
      )}
    </SidePanelContext.Provider>
  );
};

export const useSidePanelContext = () => {
  const context = useContext(SidePanelContext);
  if (!context) {
    throw new Error(
      "useSidePanelContext must be used within a SidePanelProvider",
      {
        cause: context,
      },
    );
  }
  return context;
};
