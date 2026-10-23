import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Roboto } from "next/font/google";

import Header from "./_components/Navigation/Header";
import Navigation from "./_components/Navigation/Navigation";
import ServiceWorkerRegistrar from "./_components/common/ServiceWorkerRegistrar";
import { SidePanelProvider } from "./_context/SidePanelContext";

export const metadata: Metadata = {
  title: "Budget Gamer",
  description: "Find free games and deals across multiple platforms",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Budget Gamer",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#141314",
  colorScheme: "dark",
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The app only has a dark theme, so the `dark` class enables every `dark:` style
    <html
      lang="en"
      className={`${roboto.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-[#141314]">
        <Header />
        <SidePanelProvider>
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-screen flex-1 pt-16 pb-20 focus:outline-none lg:ml-84 lg:max-w-[78rem]"
          >
            {children}
          </main>
        </SidePanelProvider>
        <Navigation />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
