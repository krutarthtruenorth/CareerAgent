import jobs from "@/data/fallback-jobs.json";

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    source: "greenhouse-style-fallback",
    jobs,
  });
}
