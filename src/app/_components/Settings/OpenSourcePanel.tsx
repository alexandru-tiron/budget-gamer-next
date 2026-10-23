import SidePanelHeader from "../SidePanel/SidePanelHeader";
import { ContactCard, PanelBody, PanelHero } from "../SidePanel/PanelBlocks";

const LIBRARIES = [
  {
    name: "Next.js",
    description: "A React framework for production-grade applications.",
    license: "MIT License",
    url: "https://github.com/vercel/next.js/blob/canary/license.md",
  },
  {
    name: "tRPC",
    description: "End-to-end typesafe APIs made easy.",
    license: "MIT License",
    url: "https://github.com/trpc/trpc/blob/main/LICENSE",
  },
  {
    name: "Drizzle ORM",
    description: "TypeScript ORM for SQL databases.",
    license: "MIT License",
    url: "https://github.com/drizzle-team/drizzle-orm/blob/main/LICENSE",
  },
  {
    name: "Tailwind CSS",
    description: "A utility-first CSS framework.",
    license: "MIT License",
    url: "https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE",
  },
  {
    name: "Zod",
    description: "TypeScript-first schema validation.",
    license: "MIT License",
    url: "https://github.com/colinhacks/zod/blob/master/LICENSE",
  },
];

export default function OpenSourcePanel() {
  return (
    <>
      <SidePanelHeader title="Open Source Libraries" />
      <PanelBody>
        <PanelHero
          icon="/images/icons/settings_icons/open_source_icon.svg"
          eyebrow="Built in the open"
          title="Open Source Libraries"
        >
          <p>
            Below is a list of open-source libraries and their respective
            licenses used in Budget Gamer:
          </p>
        </PanelHero>

        <ul className="flex flex-col gap-3">
          {LIBRARIES.map((library, index) => (
            <li
              key={library.name}
              style={{ animationDelay: `${(index + 1) * 60}ms` }}
              className="bg-surface hover:ring-accent/40 animate-fade-up flex flex-col gap-2 rounded-2xl p-4 ring-1 ring-white/5 transition duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-white">
                  {library.name}
                </h4>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/25">
                  {library.license}
                </span>
              </div>
              <p className="text-sm text-gray-400">{library.description}</p>
              <a
                href={library.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-accent inline-flex w-fit items-center gap-1 text-sm font-medium hover:underline"
              >
                License URL
                <span className="sr-only">
                  {" "}
                  for {library.name} (opens in a new tab)
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>

        <ContactCard delay={LIBRARIES.length + 1} />
      </PanelBody>
    </>
  );
}
