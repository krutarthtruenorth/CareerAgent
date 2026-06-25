import { searchGreenhouseJobs } from "@/lib/greenhouse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role")?.trim() || "AI Engineer";
  const location = searchParams.get("location")?.trim() || "";

  if (role.length > 100 || location.length > 100) {
    return Response.json(
      { error: "Role and location must be 100 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const { jobs, searchedBoards } = await searchGreenhouseJobs(role, location);

    if (jobs.length === 0) {
      return Response.json(
        {
          error: `No live Greenhouse roles matched “${role}”${
            location ? ` in “${location}”` : ""
          }. Try a broader role or location.`,
          source: "greenhouse-live",
          jobs: [],
          searchedBoards,
        },
        { status: 404 },
      );
    }

    return Response.json({
      source: "greenhouse-live",
      query: { role, location },
      searchedBoards,
      jobs,
    });
  } catch (error) {
    console.error("Greenhouse search failed:", error);
    return Response.json(
      {
        error:
          "Live Greenhouse jobs are temporarily unavailable. Please try again.",
      },
      { status: 502 },
    );
  }
}
