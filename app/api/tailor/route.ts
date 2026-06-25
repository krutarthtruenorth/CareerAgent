import { readFile } from "node:fs/promises";
import path from "node:path";
import { isJob, tailorJob } from "@/lib/career-agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jobs?: unknown };

    if (!Array.isArray(body.jobs) || body.jobs.length === 0) {
      return Response.json(
        { error: "Send at least one job in the jobs array." },
        { status: 400 },
      );
    }

    if (body.jobs.length > 10 || !body.jobs.every(isJob)) {
      return Response.json(
        { error: "The jobs payload is invalid." },
        { status: 400 },
      );
    }

    const resumePath = path.join(process.cwd(), "data", "resume.md");
    const resume = await readFile(resumePath, "utf8");
    const results = body.jobs.map((job) => tailorJob(job, resume));

    return Response.json({ results });
  } catch (error) {
    console.error("CareerAgent tailoring failed:", error);
    return Response.json(
      { error: "CareerAgent could not prepare the applications." },
      { status: 500 },
    );
  }
}
