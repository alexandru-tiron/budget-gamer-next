"use client";

import { useEffect } from "react";
import StatusMessage from "./_components/common/StatusMessage";

export default function ErrorPage({
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
    <StatusMessage
      image="error"
      title="Something went wrong"
      description="We couldn't load this page. Please try again in a moment."
    >
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-gradient-to-br from-[#7c3196] to-[#694ace] px-6 py-2 text-white"
      >
        Try again
      </button>
    </StatusMessage>
  );
}
