import { isJob, tailorJob } from "@/lib/career-agent";
import { parseResumeFile, ResumeParseError } from "@/lib/resume-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const jobsValue = formData.get("jobs");
    const resumeValue = formData.get("resume");

    if (typeof jobsValue !== "string") {
      return Response.json(
        { error: "The jobs payload is missing." },
        { status: 400 },
      );
    }

    if (!(resumeValue instanceof File)) {
      return Response.json(
        { error: "Upload your resume before tailoring applications." },
        { status: 400 },
      );
    }

    let jobs: unknown;
    try {
      jobs = JSON.parse(jobsValue);
    } catch {
      return Response.json(
        { error: "The jobs payload is invalid." },
        { status: 400 },
      );
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return Response.json(
        { error: "Send at least one job in the jobs array." },
        { status: 400 },
      );
    }

    if (jobs.length > 10 || !jobs.every(isJob)) {
      return Response.json(
        { error: "The jobs payload is invalid." },
        { status: 400 },
      );
    }

    const parsedResume = await parseResumeFile(resumeValue);
    const results = jobs.map((job) => tailorJob(job, parsedResume.text));

    return Response.json({
      results,
      resume: {
        fileName: parsedResume.fileName,
        fileType: parsedResume.fileType,
        characterCount: parsedResume.characterCount,
      },
    });
  } catch (error) {
    if (error instanceof ResumeParseError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("CareerAgent tailoring failed:", error);
    return Response.json(
      { error: "CareerAgent could not prepare the applications." },
      { status: 500 },
    );
  }
}
