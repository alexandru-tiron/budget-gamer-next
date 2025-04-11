import SidePanelHeader from "../SidePanel/SidePanelHeader";

export default function GDPRPanel() {
  return (
    <>
      <SidePanelHeader title="GDPR" />
      <div className="h-full bg-[#141314] p-4 text-white">
        <h2 className="mb-2 text-xl font-medium text-[#684ace]">
          Privacy Policy
        </h2>
        <p className="mb-6 text-sm text-gray-500">Updated at 2022-10-01</p>
        <div className="space-y-4 text-sm font-light">
          <p>
            Budget Gamer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains
            how your personal information is collected, used, and disclosed by
            Budget Gamer.
          </p>
          <h3 className="text-lg font-medium text-[#684ace]">
            What Information Do We Collect?
          </h3>
          <p>
            We collect information from you when you visit our app, register or
            subscribe to our services.
          </p>
          <h3 className="text-lg font-medium text-[#684ace]">
            How Do We Use The Information We Collect?
          </h3>
          <p>
            Any of the information we collect from you may be used in one of the
            following ways:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              To personalize your experience (your information helps us to
              better respond to your individual needs)
            </li>
            <li>
              To improve our app (we continually strive to improve our app
              offerings based on the information and feedback we receive from
              you)
            </li>
            <li>
              To improve customer service (your information helps us to more
              effectively respond to your customer service requests and support
              needs)
            </li>
            <li>
              To administer a contest, promotion, survey or other site feature
            </li>
          </ul>
          <h3 className="text-lg font-medium text-[#684ace]">Contact Us</h3>
          <p>Don&apos;t hesitate to contact us if you have any questions.</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Via Email:{" "}
              <a
                href="mailto:contact@budgetgamer.app"
                className="text-[#684ace]"
              >
                contact@budgetgamer.app
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
