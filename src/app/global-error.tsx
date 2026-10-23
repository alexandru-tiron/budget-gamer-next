"use client";

import "~/styles/globals.css";

import { useEffect } from "react";
import StatusMessage from "./_components/common/StatusMessage";

// Replaces the root layout when the layout itself fails to render
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center bg-[#141314]">
        <StatusMessage
          image="maintenance"
          title="Budget Gamer is having trouble"
          description="Something went wrong on our side. Please try again in a moment."
        >
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-gradient-to-br from-[#7c3196] to-[#694ace] px-6 py-2 text-white"
          >
            Try again
          </button>
        </StatusMessage>
      </body>
    </html>
  );
}
