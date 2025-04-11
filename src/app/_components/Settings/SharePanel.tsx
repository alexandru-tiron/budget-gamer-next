"use client";

import Image from "next/image";
import { useState } from "react";
import SidePanelHeader from "../SidePanel/SidePanelHeader";

const REPO_URL = "https://github.com/AlexT8/budget-gamer-next";

export default function SharePanel() {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(REPO_URL);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(REPO_URL)}&text=${encodeURIComponent("Check out Budget Gamer - A web app to find free games across multiple platforms!")}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(REPO_URL)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(REPO_URL)}&title=${encodeURIComponent("Budget Gamer - Find free games across multiple platforms")}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out Budget Gamer: ${REPO_URL}`)}`,
  };

  return (
    <>
      <SidePanelHeader title="Share Repository" />
      <div className="h-full bg-[#141314] p-4 text-white">
        <div className="space-y-6 text-sm font-light">
          <p>Share Budget Gamer with your friends and help us grow!</p>

          <div className="flex flex-col space-y-4">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-between rounded-lg bg-[#1e1e1e] p-3 text-white transition-all hover:bg-[#2a2a2a]"
            >
              <div className="flex items-center">
                <Image
                  src="/images/icons/settings_icons/link-45deg.svg"
                  alt="Copy"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                <span>{showCopied ? "Copied!" : "Copy Repository Link"}</span>
              </div>
            </button>

            {/* Social Media Share Buttons */}
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-[#1e1e1e] p-3 text-white transition-all hover:opacity-90"
            >
              <div className="flex items-center">
                <Image
                  src="/images/icons/settings_icons/twitter.svg"
                  alt="Twitter"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                <span>Share on Twitter</span>
              </div>
            </a>

            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-[#1e1e1e] p-3 text-white transition-all hover:opacity-90"
            >
              <div className="flex items-center">
                <Image
                  src="/images/icons/settings_icons/facebook.svg"
                  alt="Facebook"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                <span>Share on Facebook</span>
              </div>
            </a>

            <a
              href={shareLinks.reddit}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-[#1e1e1e] p-3 text-white transition-all hover:opacity-90"
            >
              <div className="flex items-center">
                <Image
                  src="/images/icons/settings_icons/reddit.svg"
                  alt="Reddit"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                <span>Share on Reddit</span>
              </div>
            </a>

            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-[#1e1e1e] p-3 text-white transition-all hover:opacity-90"
            >
              <div className="flex items-center">
                <Image
                  src="/images/icons/settings_icons/whatsapp.svg"
                  alt="WhatsApp"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                <span>Share on WhatsApp</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
