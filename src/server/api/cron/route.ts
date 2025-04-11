import { type NextRequest } from "next/server";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify the cron job secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const ctx = await createTRPCContext({ headers: req.headers });
    const caller = appRouter.createCaller(ctx);

    // Get the cron schedule from the URL path
    const path = req.nextUrl.pathname;
    let procedures: Promise<unknown>[] = [];

    if (path.includes("thursday")) {
      // Thursday at 19:05 - Amazon Prime and Epic Games
      procedures = [
        caller.scheduled.getAmazonPrimeGames(),
        caller.scheduled.getEpicFreeGames(),
      ];
    } else {
      // Daily at midnight - All other procedures
      procedures = [
        caller.scheduled.getRedditArticles(),
        caller.scheduled.getHumbleChoiceGames(),
        caller.scheduled.getPSPlusGames(),
      ];
    }

    // Run the selected procedures
    const results = await Promise.allSettled(procedures);

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    return new Response(
      JSON.stringify({
        message: "Cron job completed",
        schedule: path.includes("thursday")
          ? "Thursday 19:05"
          : "Daily midnight",
        successful: successful.length,
        failed: failed.length,
        results: results.map((r): unknown =>
          r.status === "fulfilled" ? r.value : r.reason,
        ),
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Cron job failed:", error);
    return new Response(
      JSON.stringify({ error: "Cron job failed", details: error }),
      { status: 500 },
    );
  }
}
