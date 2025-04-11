import { type NextRequest } from "next/server";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const ctx = await createTRPCContext({ headers: req.headers });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scheduled.getAmazonPrimeGames();
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Amazon Prime cron job failed:", error);
    return new Response(
      JSON.stringify({ error: "Amazon Prime cron job failed", details: error }),
      { status: 500 },
    );
  }
}
