import SidePanelHeader from "../SidePanel/SidePanelHeader";

export default function TermsPanel() {
  return (
    <>
      <SidePanelHeader title="Terms and Conditions" />
      <div className="h-full bg-[#141314] p-4 text-white">
        <h2 className="mb-2 text-xl font-medium text-[#684ace]">
        Terms and Conditions
      </h2>
      <p className="mb-6 text-sm text-gray-500">Updated at 2022-10-01</p>
      <div className="space-y-4 text-sm font-light">
        <h3 className="text-lg font-medium text-[#684ace]">General Terms</h3>
        <p>
          Never lose a game again. Game stores often have time limited giveaways
          or bundles for free games on PC, Xbox and Playstation, so you have to
          be fast to not miss them. &quot;Budget Gamer&quot; checks your
          favorite stores like Steam, Epic Games, Xbox, GoG, Humble Bundle and
          Playstation, so you don&apos;t have to.
        </p>
        <p>
          Budget Gamer will not be responsible for any outcome that may occur
          during the course of usage of our resources. We reserve the rights to
          change and revise the resources usage policy in any moment.
        </p>
        <h3 className="text-lg font-medium text-[#684ace]">License</h3>
        <p>
          Budget Gamer grants you a revocable, non-exclusive, non-transferable,
          limited license to download, install and use the app strictly in
          accordance with the terms of this Agreement.
        </p>
        <h3 className="text-lg font-medium text-[#684ace]">Contact Us</h3>
        <p>Don&apos;t hesitate to contact us if you have any questions.</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Via Email:{" "}
            <a href="mailto:contact@budgetgamer.app" className="text-[#684ace]">
              contact@budgetgamer.app
            </a>
          </li>
          </ul>
        </div>
      </div>
    </>
  );
}
