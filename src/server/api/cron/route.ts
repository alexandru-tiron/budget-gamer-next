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

    // Run all scheduled procedures
    const results = await Promise.allSettled([
      caller.scheduled.getRedditArticles(),
      caller.scheduled.getAmazonPrimeGames(),
      caller.scheduled.getEpicFreeGames(),
      caller.scheduled.getHumbleChoiceGames(),
      caller.scheduled.getPSPlusGames(),
    ]);

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    return new Response(
      JSON.stringify({
        message: "Cron job completed",
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
