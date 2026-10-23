import SidePanelHeader from "../SidePanel/SidePanelHeader";
import {
  CheckList,
  ContactCard,
  PanelBody,
  PanelCard,
  PanelHero,
} from "../SidePanel/PanelBlocks";

export default function GDPRPanel() {
  return (
    <>
      <SidePanelHeader title="GDPR" />
      <PanelBody>
        <PanelHero
          icon="/images/icons/settings_icons/gdpr_icon.svg"
          eyebrow="Legal · Updated 1 October 2022"
          title="Privacy Policy"
        >
          <p>
            Budget Gamer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains
            how your personal information is collected, used, and disclosed by
            Budget Gamer.
          </p>
        </PanelHero>

        <PanelCard title="What Information Do We Collect?" number={1} delay={1}>
          <p>
            We collect information from you when you visit our app, register or
            subscribe to our services.
          </p>
        </PanelCard>

        <PanelCard
          title="How Do We Use The Information We Collect?"
          number={2}
          delay={2}
        >
          <p>
            Any of the information we collect from you may be used in one of the
            following ways:
          </p>
          <CheckList
            items={[
              "To personalize your experience (your information helps us to better respond to your individual needs)",
              "To improve our app (we continually strive to improve our app offerings based on the information and feedback we receive from you)",
              "To improve customer service (your information helps us to more effectively respond to your customer service requests and support needs)",
              "To administer a contest, promotion, survey or other site feature",
            ]}
          />
        </PanelCard>

        <ContactCard delay={3} />
      </PanelBody>
    </>
  );
}
