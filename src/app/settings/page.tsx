"use client";

import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import AboutPanel from "../_components/Settings/AboutPanel";
import TermsPanel from "../_components/Settings/TermsPanel";
import GDPRPanel from "../_components/Settings/GDPRPanel";
import OpenSourcePanel from "../_components/Settings/OpenSourcePanel";
import SharePanel from "../_components/Settings/SharePanel";
import Image from "next/image";

interface SettingItem {
  id: string;
  title: string;
  icon: string;
  action: () => void;
}

interface SettingSection {
  id: string;
  title: string;
  icon: string;
  items: SettingItem[];
}

export default function Settings() {
  const { setSidePanel } = useSidePanelContext();

  const sections: SettingSection[] = [
    {
      id: "general",
      title: "General",
      icon: "/images/icons/settings_icons/general_icon.svg",
      items: [
        {
          id: "about",
          title: "About App",
          icon: "/images/icons/settings_icons/about_app_icon.svg",
          action: () => setSidePanel(<AboutPanel />),
        },
        {
          id: "share-repo",
          title: "Share Repository",
          icon: "/images/icons/settings_icons/share_app_icon.svg",
          action: () => setSidePanel(<SharePanel />),
        },
        {
          id: "discord",
          title: "Join our Discord",
          icon: "/images/icons/settings_icons/discord_icon.svg",
          action: () => window.open("https://discord.gg/budgetgamer", "_blank"),
        },
        {
          id: "contact",
          title: "Contact Us",
          icon: "/images/icons/settings_icons/contact_us_icon.svg",
          action: () => window.open("mailto:contact@budgetgamer.app", "_blank"),
        },
      ],
    },
    {
      id: "legal",
      title: "Legal information",
      icon: "/images/icons/settings_icons/legal_icon.svg",
      items: [
        {
          id: "terms",
          title: "Terms of Service",
          icon: "/images/icons/settings_icons/terms_icon.svg",
          action: () => setSidePanel(<TermsPanel />),
        },
        {
          id: "gdpr",
          title: "GDPR",
          icon: "/images/icons/settings_icons/gdpr_icon.svg",
          action: () => setSidePanel(<GDPRPanel />),
        },
        {
          id: "open-source",
          title: "Open Source Licenses",
          icon: "/images/icons/settings_icons/open_source_icon.svg",
          action: () => setSidePanel(<OpenSourcePanel />),
        },
      ],
    },
  ];

  const renderSection = (section: SettingSection) => (
    <div key={section.id} className="mb-6 w-full text-white md:w-1/2 lg:w-1/3">
      <div className="mb-4 flex items-center">
        <Image
          src={section.icon}
          alt={section.title}
          className="mr-2 h-6 w-6"
          width={24}
          height={24}
        />
        <h3 className="text-lg font-medium">{section.title}</h3>
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-[#1e1e1e]">
        {section.items.map((item, index) => (
          <div
            key={item.id}
            className={`flex cursor-pointer items-center p-4 ${
              index !== section.items.length - 1
                ? "border-b border-gray-200 dark:border-gray-700"
                : ""
            }`}
            onClick={item.action}
          >
            <Image
              src={item.icon}
              alt={item.title}
              className="mr-3 h-6 w-6"
              width={24}
              height={24}
            />
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4 py-6 md:px-6 lg:px-8">
      {sections.map(renderSection)}
      <div className="text-light mt-8 mt-auto justify-end text-center text-xs text-gray-400">
        <div id="version">
          <p>Version 2.0.0</p>
          <p className="flex items-center gap-2">
            Made with{" "}
            <Image
              src="/images/icons/settings_icons/heart.svg"
              alt="heart"
              width={14}
              height={14}
            />{" "}
            by{" "}
            <Image
              src="/images/icons/settings_icons/2m_logo.svg"
              alt="2m"
              width={16}
              height={16}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
