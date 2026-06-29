import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { TailoredResult } from "@/lib/career-agent";

function safeFileName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function originalResumeParagraphs(resumeText: string) {
  return resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          children: [new TextRun(line.replace(/^#{1,6}\s*/, ""))],
          spacing: { after: 100 },
        }),
    );
}

export async function buildTailoredResumeDocx(
  result: TailoredResult,
  resumeText: string,
) {
  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `Tailored Resume — ${result.jobTitle}`,
            heading: HeadingLevel.TITLE,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${result.company} · ${result.location}`,
                color: "45624F",
              }),
            ],
            spacing: { after: 280 },
          }),
          new Paragraph({
            text: "Targeted Professional Summary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: result.tailoredSummary,
            spacing: { after: 220 },
          }),
          new Paragraph({
            text: "Relevant Skills",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: result.tailoredSkills.join(" · ") || "See experience below",
            spacing: { after: 220 },
          }),
          new Paragraph({
            text: "Prioritized Experience",
            heading: HeadingLevel.HEADING_1,
          }),
          ...result.tailoredBullets.map(
            (bullet) =>
              new Paragraph({
                text: bullet,
                bullet: { level: 0 },
                spacing: { after: 100 },
              }),
          ),
          new Paragraph({
            text: "Original Resume Content",
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
          }),
          ...originalResumeParagraphs(resumeText),
        ],
      },
    ],
  });

  return {
    buffer: await Packer.toBuffer(document),
    fileName: `${safeFileName(result.company)}-${safeFileName(
      result.jobTitle,
    )}-tailored-resume.docx`,
  };
}
