"use client";
import { useId, useState, useTransition, type SubmitEvent } from "react";
import { submitLink, type SubmitLinkResult } from "~/app/_actions/submit-link";
import SidePanelHeader from "./SidePanelHeader";

export default function AddLinkSidePanel({
  type,
}: {
  type: "game" | "article";
}) {
  const [link, setLink] = useState("");
  const [result, setResult] = useState<SubmitLinkResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const submitResult = await submitLink(link, type);
      setResult(submitResult);
      if (submitResult.ok) setLink("");
    });
  };

  return (
    <div className="flex flex-col text-white">
      <SidePanelHeader
        title={type === "game" ? "Add a free game" : "Add an article link"}
      />

      <form
        className="mt-8 flex flex-col gap-4 p-4 md:p-8 lg:p-4"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="sr-only">
            {type === "game" ? "Store page link" : "Giveaway article link"}
          </label>
          <input
            id={inputId}
            type="url"
            required
            placeholder="Enter link here"
            className="w-full rounded-lg bg-[#1e1e1e] p-2"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          className="mx-auto w-2/3 rounded-lg bg-gradient-to-br from-[#7c3196] via-[#7b36a3] via-[#773cb1] via-[#7243bf] to-[#694ace] p-2 disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Checking link..." : "Submit"}
        </button>
        {isPending && type === "game" && (
          <p className="text-center text-xs text-gray-400">
            Checking the store page can take up to a minute.
          </p>
        )}
        {result && (
          <p
            role="status"
            className={`rounded-lg p-2 text-center text-sm ${result.ok ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"}`}
          >
            {result.message}
          </p>
        )}
      </form>
      {type === "article" ? (
        <div className="mt-4 flex flex-col gap-4 p-4 md:p-8 lg:p-4">
          <h3 className="text-xl font-bold text-[#8f73e8]">Hello</h3>
          <p className="text-sm font-light">
            If you find a giveaway article and want to share it with others,
            please paste the link in the field above and we will add it
            automatically if it&apos;s valid.
          </p>
          <p className="text-sm font-light">We support platforms like:</p>
          <ul className="ml-4 list-disc text-sm font-light">
            <li>Twitter / X</li>
            <li>Reddit</li>
            <li>Humble Bundle</li>
            <li>Gleam</li>
            <li>Facebook</li>
          </ul>
          <p className="text-sm font-light">Thank you for your contribution!</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 p-4 md:p-8 lg:p-4">
          <h3 className="text-xl font-bold text-[#8f73e8]">Hello</h3>
          <p className="text-sm font-light">
            If you find a game with 100% discount and want to share it with
            others, please paste the store link in the field above and we will
            add it automatically if it&apos;s free.
          </p>
          <p className="text-sm font-light">We support games from:</p>
          <ul className="ml-4 list-disc text-sm font-light">
            <li>Steam</li>
            <li>GOG</li>
            <li>Humble Bundle</li>
            <li>PlayStation</li>
            <li>Xbox</li>
            <li>Nintendo eShop (Europe)</li>
          </ul>
          <p className="text-sm font-light">
            Epic Games freebies are added automatically every week.
          </p>
          <p className="text-sm font-light">Thank you for your contribution!</p>
        </div>
      )}
    </div>
  );
}
