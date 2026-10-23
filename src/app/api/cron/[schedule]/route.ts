import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "cron" });

// The scrapers launch Chromium, which needs the Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 60s is the highest value every Vercel plan accepts; raise it to 300 with fluid compute
export const maxDuration = 60;

type JobOutcome = { ok: true; result: unknown } | { ok: false; error: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ schedule: string }> },
) {
  // Vercel sends the cron secret as a bearer token
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { schedule } = await params;
  const ctx = await createTRPCContext({ headers: req.headers });
  const caller = createCaller({ ...ctx, __internal: true });

  let jobs: Record<string, () => Promise<unknown>>;
  if (schedule === "thursday") {
    // Thursday at 19:05 - Amazon Prime, Epic Games and the Free Play Days posted that afternoon
    jobs = {
      amazonPrime: () => caller.scheduled.getAmazonPrimeGames(),
      epicGames: () => caller.scheduled.getEpicFreeGames(),
      xboxFreePlayDays: () => caller.scheduled.getXboxFreePlayDays(),
    };
  } else if (schedule === "daily") {
    // Daily at midnight - All other procedures
    jobs = {
      redditArticles: () => caller.scheduled.getRedditArticles(),
      humbleChoice: () => caller.scheduled.getHumbleChoiceGames(),
      psPlus: () => caller.scheduled.getPSPlusGames(),
      xboxGamePass: () => caller.scheduled.getXboxGamePassGames(),
      xboxFreePlayDays: () => caller.scheduled.getXboxFreePlayDays(),
      xboxGiveaways: () => caller.scheduled.getXboxGiveaways(),
      nintendoGameTrials: () => caller.scheduled.getNintendoGameTrials(),
    };
  } else {
    return new Response("Not found", { status: 404 });
  }

  // Run every job, recording a failure instead of stopping the others
  const results = await Promise.all(
    Object.entries(jobs).map(
      async ([name, job]): Promise<[string, JobOutcome]> => {
        try {
          return [name, { ok: true, result: await job() }];
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return [name, { ok: false, error: message }];
        }
      },
    ),
  );

  // Pages are statically generated, so refresh them with the new data
  revalidatePath("/");
  revalidatePath("/timed");
  revalidatePath("/articles");

  const report = Object.fromEntries(results);
  const failed = results.filter(([, outcome]) => !outcome.ok).length;
  if (failed > 0) {
    log.error("Cron run had failed jobs", { schedule, failed, report });
  } else {
    log.info("Cron run finished", { schedule, report });
  }

  return Response.json(
    { schedule, successful: results.length - failed, failed, results: report },
    { status: failed > 0 ? 500 : 200 },
  );
}
