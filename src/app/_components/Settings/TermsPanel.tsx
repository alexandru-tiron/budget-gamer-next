import SidePanelHeader from "../SidePanel/SidePanelHeader";
import {
  ContactCard,
  PanelBody,
  PanelCard,
  PanelHero,
} from "../SidePanel/PanelBlocks";

export default function TermsPanel() {
  return (
    <>
      <SidePanelHeader title="Terms and Conditions" />
      <PanelBody>
        <PanelHero
          icon="/images/icons/settings_icons/terms_icon.svg"
          eyebrow="Legal · Updated 1 October 2022"
          title="Terms and Conditions"
        />

        <PanelCard title="General Terms" number={1} delay={1}>
          <p>
            Never lose a game again. Game stores often have time limited
            giveaways or bundles for free games on PC, Xbox and Playstation, so
            you have to be fast to not miss them. &quot;Budget Gamer&quot;
            checks your favorite stores like Steam, Epic Games, Xbox, GoG,
            Humble Bundle and Playstation, so you don&apos;t have to.
          </p>
          <p>
            Budget Gamer will not be responsible for any outcome that may occur
            during the course of usage of our resources. We reserve the rights
            to change and revise the resources usage policy in any moment.
          </p>
        </PanelCard>

        <PanelCard title="License" number={2} delay={2}>
          <p>
            Budget Gamer grants you a revocable, non-exclusive,
            non-transferable, limited license to download, install and use the
            app strictly in accordance with the terms of this Agreement.
          </p>
        </PanelCard>

        <ContactCard delay={3} />
      </PanelBody>
    </>
  );
}
