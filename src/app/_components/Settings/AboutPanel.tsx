import SidePanelHeader from "../SidePanel/SidePanelHeader";

export default function AboutPanel() {
  return (
    <>
      <SidePanelHeader title="About app" />
      <div className="h-full bg-[#141314] p-4 text-white">
        <h2 className="mb-6 text-xl font-medium text-[#684ace]">
          Welcome to Budget Gamer!
        </h2>
        <div className="space-y-4 pb-12 text-sm font-light">
          <p>
            Never lose a game again. Game stores often have time limited
            giveaways or bundles for free games on PC, Xbox and Playstation, so
            you have to be fast to not miss them. &quot;Budget Gamer&quot;
            checks your favorite stores like Steam, Epic Games, Xbox, GoG,
            Humble Bundle and Playstation, so you don&apos;t have to. The most
            common are Steam Free Weeks and Free Weekends and the Free Epic
            Games of the Week from the Epic Games Store, which are free-to-keep!
          </p>
          <p>
            It&apos;s our job to find the best free game offers for you and
            gather them in one place. Our smart and efficient algorithm is
            constantly searching all the stores and gaming platforms to save
            your time, energy and money!
          </p>
          <p>
            BG is an app dedicated to gamers who would keep track on the latest
            deals in gaming. Features:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              See games with 100% discounts, create an alert for one, and get
              notified.
            </li>
            <li>
              See active external giveaways, create an alert for one and
              participate in them.
            </li>
            <li>
              Check the latest free games from their subscription of choice.
            </li>
            <li>Only dark mode</li>
          </ul>
          <p>
            This app will always be free and adfree. We are also going to listen
            to feedback and try to implement features that will be requested so
            we can bring as much value as possible to our users.
          </p>
          <h3 className="mt-6 text-lg font-medium text-[#684ace]">
            Future updates:
          </h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Add in app game key giveaways on a monthly or weekly basis.</li>
            <li>
              Create a donate feature, which will be used to purchase game keys
              and give them back to the community. We&apos;ll keep it as
              transparent as possible.
            </li>
          </ul>
          <p>Thank you for reading this and using our app.</p>
        </div>
      </div>
    </>
  );
}
