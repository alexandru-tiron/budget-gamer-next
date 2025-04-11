"use client";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";
import { useState } from "react";
import SidePanelHeader from "./SidePanelHeader";

export default function AddLinkSidePanel({
  type,
  handleSubmit,
}: {
  type: "game" | "article";
  handleSubmit: (link: string, type: "game" | "article") => void;
}) {
  const { setSidePanel } = useSidePanelContext();
  const [link, setLink] = useState("");

  return (
    <div className="flex flex-col text-white">
      <SidePanelHeader
        title={type === "game" ? "Add a free game" : "Add an article link"}
      />

      <div className="mt-8 flex flex-col gap-4 p-4 md:p-8 lg:p-4">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter link here"
            className="w-full rounded-lg bg-[#1e1e1e] p-2"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <button
          className="mx-auto w-2/3 rounded-lg bg-gradient-to-br from-[#7c3196] via-[#7b36a3] via-[#773cb1] via-[#7243bf] to-[#694ace] p-2"
          onClick={() => {
            handleSubmit(link, type);
            setSidePanel(null);
          }}
        >
          Submit
        </button>
      </div>
      {type === "article" ? (
        <div className="mt-4 flex flex-col gap-4 p-4 md:p-8 lg:p-4">
          <h1 className="text-xl font-bold text-[#694ace]">Hello</h1>
          <p className="text-sm font-light">
            If you find a giveaway article and want to share it with others,
            please paste the link in the field above and we will add it
            automatically if it&apos;s valid.
          </p>
          <p className="text-sm font-light">We support platforms like:</p>
          <ul className="ml-4 list-disc text-sm font-light">
            <li>Twitter</li>
            <li>Reddit</li>
            <li>Humble Bundle</li>
            <li>Gleam</li>
            <li>Facebook</li>
          </ul>
          <p className="text-sm font-light">Thank you for your contribution!</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 p-4 md:p-8 lg:p-4">
          <h1 className="text-xl font-bold text-[#694ace]">Hello</h1>
          <p className="text-sm font-light">
            If you find a game with 100% discount and want to share it with
            others, please paste the store link in the field above and we will
            add it automatically if it&apos;s free.
          </p>
          <p className="text-sm font-light">We support games from:</p>
          <ul className="ml-4 list-disc text-sm font-light">
            <li>Steam</li>
            <li>Epic Games</li>
            <li>GOG</li>
            <li>Humble Bundle</li>
            <li>PlayStation</li>
          </ul>
          <p className="text-sm font-light">Thank you for your contribution!</p>
        </div>
      )}
    </div>
  );
}
