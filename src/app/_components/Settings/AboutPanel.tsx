import Image from "next/image";
import SidePanelHeader from "../SidePanel/SidePanelHeader";
import { CheckList, PanelBody, PanelCard } from "../SidePanel/PanelBlocks";

const FEATURES = [
  {
    title: "Free games",
    icon: "/images/icons/home-selected.svg",
    text: "See games with 100% discounts, create an alert for one, and get notified.",
  },
  {
    title: "Giveaways",
    icon: "/images/icons/articles_selected.svg",
    text: "See active external giveaways, create an alert for one and participate in them.",
  },
  {
    title: "Subscriptions",
    icon: "/images/icons/calendar-selected.svg",
    text: "Check the latest free games from their subscription of choice.",
  },
  {
    title: "Dark mode",
    icon: null,
    text: "Only dark mode.",
  },
];

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="text-accent size-4.5"
    >
      <path
        fillRule="evenodd"
        d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AboutPanel() {
  return (
    <>
      <SidePanelHeader title="About app" />
      <PanelBody>
        <div className="bg-surface animate-fade-up relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl p-6 text-center ring-1 ring-white/5">
          <div
            aria-hidden="true"
            className="bg-accent-strong/35 pointer-events-none absolute -top-20 left-1/2 size-56 -translate-x-1/2 rounded-full blur-3xl"
          />
          <span className="bg-page/60 relative flex size-20 items-center justify-center rounded-2xl shadow-[0_0_48px_-8px_rgb(143_115_232_/_0.8)] ring-1 ring-white/10">
            <Image
              src="/images/icons/Color Favicon.svg"
              alt=""
              width={56}
              height={56}
              className="size-14"
            />
          </span>
          <h3 className="relative text-2xl font-bold text-white">
            Welcome to Budget Gamer!
          </h3>
          <p className="relative text-sm leading-relaxed text-gray-300">
            Never lose a game again. Game stores often have time limited
            giveaways or bundles for free games on PC, Xbox and Playstation, so
            you have to be fast to not miss them. &quot;Budget Gamer&quot;
            checks your favorite stores like Steam, Epic Games, Xbox, GoG,
            Humble Bundle and Playstation, so you don&apos;t have to.
          </p>
        </div>

        <PanelCard delay={1}>
          <p>
            The most common are Steam Free Weeks and Free Weekends and the Free
            Epic Games of the Week from the Epic Games Store, which are
            free-to-keep!
          </p>
          <p>
            It&apos;s our job to find the best free game offers for you and
            gather them in one place. Our smart and efficient algorithm is
            constantly searching all the stores and gaming platforms to save
            your time, energy and money!
          </p>
        </PanelCard>

        <section
          aria-labelledby="about-features"
          className="flex flex-col gap-3"
        >
          <h4
            id="about-features"
            className="px-1 text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase"
          >
            Features
          </h4>
          <ul className="grid grid-cols-2 gap-3">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.title}
                style={{ animationDelay: `${(index + 2) * 60}ms` }}
                className="bg-surface hover:ring-accent/40 animate-fade-up flex flex-col gap-2 rounded-2xl p-3.5 ring-1 ring-white/5 transition duration-300 hover:-translate-y-0.5"
              >
                <span className="bg-accent/15 ring-accent/25 flex size-9 items-center justify-center rounded-lg ring-1">
                  {feature.icon ? (
                    <Image
                      src={feature.icon}
                      alt=""
                      width={18}
                      height={18}
                      className="size-4.5"
                    />
                  ) : (
                    <MoonIcon />
                  )}
                </span>
                <span className="text-sm font-semibold text-white">
                  {feature.title}
                </span>
                <span className="text-xs leading-relaxed text-gray-400">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="from-accent-deep/30 to-accent-strong/25 ring-accent/25 animate-fade-up flex items-center gap-3 rounded-2xl bg-gradient-to-r p-4 ring-1 [animation-delay:360ms]">
          <Image
            src="/images/icons/settings_icons/heart.svg"
            alt=""
            width={22}
            height={22}
            className="size-5.5 shrink-0 animate-pulse"
          />
          <p className="text-sm text-gray-100">
            This app will always be free and adfree. We are also going to listen
            to feedback and try to implement features that will be requested so
            we can bring as much value as possible to our users.
          </p>
        </div>

        <PanelCard title="Future updates" delay={7}>
          <CheckList
            items={[
              "Add in app game key giveaways on a monthly or weekly basis.",
              "Create a donate feature, which will be used to purchase game keys and give them back to the community. We'll keep it as transparent as possible.",
            ]}
          />
        </PanelCard>

        <p className="text-center text-xs text-gray-500">
          Thank you for reading this and using our app.
        </p>
      </PanelBody>
    </>
  );
}
