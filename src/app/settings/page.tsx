import type { ReactNode } from "react";
import Image from "next/image";
import AboutPanel from "../_components/Settings/AboutPanel";
import TermsPanel from "../_components/Settings/TermsPanel";
import GDPRPanel from "../_components/Settings/GDPRPanel";
import OpenSourcePanel from "../_components/Settings/OpenSourcePanel";
import SharePanel from "../_components/Settings/SharePanel";
import SettingsPanelButton from "../_components/Settings/SettingsPanelButton";

// An item either opens a side panel or links to an external page
type SettingItem = {
  id: string;
  title: string;
  icon: string;
} & ({ panel: ReactNode } | { href: string });

interface SettingSection {
  id: string;
  title: string;
  icon: string;
  items: SettingItem[];
}

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
        panel: <AboutPanel />,
      },
      {
        id: "share-repo",
        title: "Share Repository",
        icon: "/images/icons/settings_icons/share_app_icon.svg",
        panel: <SharePanel />,
      },
      {
        id: "discord",
        title: "Join our Discord",
        icon: "/images/icons/settings_icons/discord_icon.svg",
        href: "https://discord.gg/budgetgamer",
      },
      {
        id: "contact",
        title: "Contact Us",
        icon: "/images/icons/settings_icons/contact_us_icon.svg",
        href: "mailto:contact@budgetgamer.app",
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
        panel: <TermsPanel />,
      },
      {
        id: "gdpr",
        title: "GDPR",
        icon: "/images/icons/settings_icons/gdpr_icon.svg",
        panel: <GDPRPanel />,
      },
      {
        id: "open-source",
        title: "Open Source Licenses",
        icon: "/images/icons/settings_icons/open_source_icon.svg",
        panel: <OpenSourcePanel />,
      },
    ],
  },
];

const itemClassName =
  "flex w-full cursor-pointer items-center p-4 text-left transition-colors hover:bg-white/5";

export default function Settings() {
  const renderItem = (item: SettingItem) => {
    const content = (
      <>
        <Image
          src={item.icon}
          alt=""
          className="mr-3 h-6 w-6"
          width={24}
          height={24}
        />
        <span>{item.title}</span>
      </>
    );

    if ("href" in item) {
      const isExternal = item.href.startsWith("http");
      return (
        <a
          href={item.href}
          className={itemClassName}
          {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
        >
          {content}
          {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      );
    }

    return (
      <SettingsPanelButton
        title={item.title}
        panel={item.panel}
        className={itemClassName}
      >
        {content}
      </SettingsPanelButton>
    );
  };

  const renderSection = (section: SettingSection) => (
    <section
      key={section.id}
      aria-labelledby={`settings-${section.id}`}
      className="mb-6 w-full text-white md:w-1/2 lg:w-1/3"
    >
      <div className="mb-4 flex items-center">
        <Image
          src={section.icon}
          alt=""
          className="mr-2 h-6 w-6"
          width={24}
          height={24}
        />
        <h2 id={`settings-${section.id}`} className="text-lg font-medium">
          {section.title}
        </h2>
      </div>
      <ul className="overflow-hidden rounded-xl bg-[#1e1e1e] shadow-sm">
        {section.items.map((item, index) => (
          <li
            key={item.id}
            className={
              index !== section.items.length - 1
                ? "border-b border-gray-700"
                : ""
            }
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4 py-6 md:px-6 lg:px-8">
      {sections.map(renderSection)}
      <div className="mt-auto justify-end pt-8 text-center text-xs text-gray-400">
        <div id="version">
          <p>Version 2.0.0</p>
          <p className="flex items-center gap-2">
            Made with{" "}
            <Image
              src="/images/icons/settings_icons/heart.svg"
              alt="love"
              width={14}
              height={14}
            />{" "}
            by{" "}
            <Image
              src="/images/icons/settings_icons/2m_logo.svg"
              alt="2M"
              width={16}
              height={16}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
