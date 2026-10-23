import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { type NextRequest } from "next/server";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "trpc" });

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error }) => {
      // Rejected input (4xx) is expected traffic; only server faults are errors
      const status = getHTTPStatusCodeFromError(error);
      const context = { path: path ?? "<no-path>", status, error };
      if (status >= 500) {
        log.error("tRPC request failed", context);
      } else {
        log.warn("tRPC request rejected", { ...context, error: error.message });
      }
    },
  });

export { handler as GET, handler as POST };
