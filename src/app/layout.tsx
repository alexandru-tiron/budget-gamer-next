import "~/styles/globals.css";

import { type Metadata } from "next";
import { Roboto } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/Navigation/Header";
import Navigation from "./_components/Navigation/Navigation";
import { SidePanelProvider } from "./_context/SidePanelContext";

export const metadata: Metadata = {
  title: "Budget Gamer",
  description: "Find free games and deals across multiple platforms",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
    <html lang="en" className={`${roboto.variable}`} suppressHydrationWarning>
      <body className="bg-[#141314]">
        <TRPCReactProvider>
          <Header />
          <SidePanelProvider>
            <main className="min-h-screen flex-1 pt-16 pb-20 lg:ml-84 lg:max-w-[78rem]">
              {children}
            </main>
          </SidePanelProvider>
          <Navigation />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
