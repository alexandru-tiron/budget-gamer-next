// Some stores serve different (or no) markup to unknown clients, so look like a browser
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const TIMEOUT_MS = 20_000;

async function request(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { "user-agent": BROWSER_USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return response;
}

/** GET a page as text, failing on non-2xx responses and after 20 seconds. */
export async function fetchText(url: string): Promise<string> {
  return (await request(url)).text();
}

/** GET a JSON document, failing on non-2xx responses and after 20 seconds. */
export async function fetchJson<T>(url: string): Promise<T> {
  return (await request(url)).json() as Promise<T>;
}
