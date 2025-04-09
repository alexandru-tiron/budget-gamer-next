"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function ArticleSubmitForm() {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateArticle = api.articles.validateAndCreateArticle.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setLink("");
    },
    onError: (error) => {
      setError(error.message);
      setSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!link.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    validateArticle.mutate({ link });
  };

  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Submit Article Link</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="link" className="mb-1 block font-medium">
            Article URL
          </label>
          <input
            id="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full rounded-md border p-2"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Only links from Twitter, Reddit, Humble Bundle, Gleam.io, and
            Facebook are accepted.
          </p>
        </div>

        {error && (
          <div className="rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}

        {success && (
          <div className="rounded bg-green-50 p-3 text-green-600">
            Article submitted successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={validateArticle.isPending}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {validateArticle.isPending ? "Submitting..." : "Submit Article"}
        </button>
      </form>
    </div>
  );
}
