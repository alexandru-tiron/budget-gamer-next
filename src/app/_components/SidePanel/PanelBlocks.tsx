import Image from "next/image";
import type { ReactNode } from "react";

// Building blocks shared by the side panels, so each one opens the same way: a hero with an
// icon and title, then content in cards.

export const CONTACT_EMAIL = "contact@budgetgamer.app";

export function PanelHero({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: string;
  eyebrow: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-surface animate-fade-up relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/5">
      <div
        aria-hidden="true"
        className="bg-accent-strong/30 pointer-events-none absolute -top-16 -right-12 size-48 rounded-full blur-3xl"
      />
      <div className="relative flex flex-col gap-3">
        <span className="bg-accent/15 ring-accent/30 flex size-12 items-center justify-center rounded-xl shadow-[0_0_32px_-6px_rgb(143_115_232_/_0.7)] ring-1">
          <Image src={icon} alt="" width={24} height={24} className="size-6" />
        </span>
        <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
        <h3 className="text-2xl leading-tight font-bold text-balance text-white">
          {title}
        </h3>
        {children && (
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-gray-300">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function PanelCard({
  title,
  number,
  children,
  delay = 0,
}: {
  title?: string;
  /** Shown as a badge before the title, e.g. for numbered legal sections */
  number?: number;
  children: ReactNode;
  /** Position in the panel, used to stagger the entrance animation */
  delay?: number;
}) {
  return (
    <section
      style={{ animationDelay: `${delay * 60}ms` }}
      className="bg-surface animate-fade-up flex flex-col gap-3 rounded-2xl p-4 text-sm leading-relaxed text-gray-300 ring-1 ring-white/5"
    >
      {title && (
        <h4 className="flex items-start gap-2.5 text-base leading-snug font-semibold text-white">
          {number !== undefined && (
            <span className="bg-accent/15 text-accent ring-accent/25 -mt-px flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ring-1">
              {String(number).padStart(2, "0")}
            </span>
          )}
          {title}
        </h4>
      )}
      {children}
    </section>
  );
}

/** A bulleted list with accent check marks instead of plain dots. */
export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-accent mt-0.5 size-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ContactCard({ delay = 0 }: { delay?: number }) {
  return (
    <section
      style={{ animationDelay: `${delay * 60}ms` }}
      className="from-accent-deep/25 to-accent-strong/20 ring-accent/20 animate-fade-up flex flex-col gap-3 rounded-2xl bg-gradient-to-br p-4 ring-1"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
          <Image
            src="/images/icons/settings_icons/contact_us_icon.svg"
            alt=""
            width={20}
            height={20}
            className="size-5"
          />
        </span>
        <div>
          <h4 className="font-semibold text-white">Questions?</h4>
          <p className="text-sm text-gray-300">
            Don&apos;t hesitate to contact us.
          </p>
        </div>
      </div>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="group flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
      >
        {CONTACT_EMAIL}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4 transition group-hover:translate-x-0.5"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3.75A.75.75 0 0 1 3 10Z"
            clipRule="evenodd"
          />
        </svg>
      </a>
    </section>
  );
}

/** Content area under the panel header. */
export function PanelBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10 text-white">
      {children}
    </div>
  );
}
