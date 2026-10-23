// Some stores serve different (or no) markup to unknown clients, so look like a browser
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const TIMEOUT_MS = 20_000;

/**
 * Fetch with a browser user agent, failing on non-2xx responses and after 20 seconds. Headers in
 * `init` are added to the user agent.
 */
export async function fetchOk(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) {
    headers.set("user-agent", BROWSER_USER_AGENT);
  }
  const response = await fetch(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${url} failed with ${response.status}`,
    );
  }
  return response;
}

/** Fetch a page as text, failing on non-2xx responses and after 20 seconds. */
export async function fetchText(
  url: string,
  init?: RequestInit,
): Promise<string> {
  return (await fetchOk(url, init)).text();
}

/** Fetch a JSON document, failing on non-2xx responses and after 20 seconds. */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  return (await fetchOk(url, init)).json() as Promise<T>;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decode the HTML entities that show up in scraped text, e.g. `&amp;` and `&#8217;`. */
export function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        return String.fromCodePoint(parseInt(code.slice(2), 16));
      }
      if (code.startsWith("#")) {
        return String.fromCodePoint(parseInt(code.slice(1), 10));
      }
      return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
    },
  );
}
