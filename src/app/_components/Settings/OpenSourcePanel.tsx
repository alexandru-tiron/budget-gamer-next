import SidePanelHeader from "../SidePanel/SidePanelHeader";

export default function OpenSourcePanel() {
  return (
    <>
      <SidePanelHeader title="Open Source Libraries" />
      <div className="mb-6 h-full bg-[#141314] p-4 text-white">
        <h2 className="pb-6 text-xl font-medium text-[#8f73e8]">
          Open Source Libraries
        </h2>
        <div className="space-y-6 text-sm font-light">
          <p>
            Below is a list of open-source libraries and their respective
            licenses used in Budget Gamer:
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#8f73e8]">Next.js</h3>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>A React framework for production-grade applications.</li>
                <li>License: MIT License</li>
                <li>
                  <a
                    href="https://github.com/vercel/next.js/blob/canary/license.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8f73e8]"
                  >
                    License URL
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#8f73e8]">tRPC</h3>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>End-to-end typesafe APIs made easy.</li>
                <li>License: MIT License</li>
                <li>
                  <a
                    href="https://github.com/trpc/trpc/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8f73e8]"
                  >
                    License URL
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#8f73e8]">
                Drizzle ORM
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>TypeScript ORM for SQL databases.</li>
                <li>License: MIT License</li>
                <li>
                  <a
                    href="https://github.com/drizzle-team/drizzle-orm/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8f73e8]"
                  >
                    License URL
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#8f73e8]">
                Tailwind CSS
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>A utility-first CSS framework.</li>
                <li>License: MIT License</li>
                <li>
                  <a
                    href="https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8f73e8]"
                  >
                    License URL
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#8f73e8]">Zod</h3>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>TypeScript-first schema validation.</li>
                <li>License: MIT License</li>
                <li>
                  <a
                    href="https://github.com/colinhacks/zod/blob/master/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8f73e8]"
                  >
                    License URL
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 pb-8">
            <h3 className="text-lg font-medium text-[#8f73e8]">Contact Us</h3>
            <p className="mt-2">
              Don&apos;t hesitate to contact us if you have any questions.
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Via Email:{" "}
                <a
                  href="mailto:contact@budgetgamer.app"
                  className="text-[#8f73e8]"
                >
                  contact@budgetgamer.app
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
