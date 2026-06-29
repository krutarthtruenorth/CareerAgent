import { getToken } from "@auth/core/jwt";
import { isJob, tailorJob } from "@/lib/career-agent";
import { createGmailDraft, getGmailAccessToken } from "@/lib/gmail";
import { parseResumeFile, ResumeParseError } from "@/lib/resume-parser";
import { buildTailoredResumeDocx } from "@/lib/tailored-resume";

export const runtime = "nodejs";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    if (!process.env.AUTH_SECRET) {
      return Response.json(
        { error: "Gmail OAuth is not configured." },
        { status: 503 },
      );
    }

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!token) {
      return Response.json(
        { error: "Connect Gmail before creating a draft." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const jobValue = formData.get("job");
    const resumeValue = formData.get("resume");
    const recipientValue = formData.get("recipient");
    const recipient =
      typeof recipientValue === "string" ? recipientValue.trim() : "";

    if (recipient && !isEmail(recipient)) {
      return Response.json(
        { error: "Enter a valid recipient email or leave it blank." },
        { status: 400 },
      );
    }

    if (typeof jobValue !== "string" || !(resumeValue instanceof File)) {
      return Response.json(
        { error: "The job or resume is missing." },
        { status: 400 },
      );
    }

    const job: unknown = JSON.parse(jobValue);
    if (!isJob(job)) {
      return Response.json(
        { error: "The job payload is invalid." },
        { status: 400 },
      );
    }

    const parsedResume = await parseResumeFile(resumeValue);
    const tailoredResult = tailorJob(job, parsedResume.text);
    const attachment = await buildTailoredResumeDocx(
      tailoredResult,
      parsedResume.text,
    );
    const accessToken = await getGmailAccessToken(token);
    const draft = await createGmailDraft({
      accessToken,
      to: recipient || undefined,
      subject: tailoredResult.applicationEmail.subject,
      body: tailoredResult.applicationEmail.body,
      attachment: attachment.buffer,
      attachmentName: attachment.fileName,
    });

    return Response.json({
      ...draft,
      attachmentName: attachment.fileName,
    });
  } catch (error) {
    if (error instanceof ResumeParseError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("Gmail draft creation failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "CareerAgent could not create the Gmail draft.",
      },
      { status: 500 },
    );
  }
}
