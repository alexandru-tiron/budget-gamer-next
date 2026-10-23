// Liveness check: the server is up. It doesn't touch the database, so an outage there doesn't
// get healthy containers restarted.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
