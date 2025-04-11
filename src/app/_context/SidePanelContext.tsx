"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode, FC } from "react";
import { usePathname } from "next/navigation";
interface SidePanelContextProps {
  setSidePanel: React.Dispatch<React.SetStateAction<null | ReactNode>>;
}

interface SidePanelProviderProps {
  children: ReactNode;
}
const SidePanelContext = createContext<SidePanelContextProps | null>(null);

export const SidePanelProvider: FC<SidePanelProviderProps> = ({ children }) => {
  const [sidePanel, setSidePanel] = useState<null | ReactNode>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (currentPath !== pathname) {
      setSidePanel(null);
      setCurrentPath(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const sidePanelState = useMemo(() => ({ setSidePanel }), []);
  return (
    <SidePanelContext.Provider value={sidePanelState}>
      {children}
      {sidePanel && (
        <aside className="scrollbar-vertical-styled absolute top-0 right-0 z-110 h-[100dvh] max-h-[100dvh] w-full overflow-y-scroll border-l-2 border-[#1e1e1e] bg-[#141314] lg:w-84">
          {sidePanel}
        </aside>
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
