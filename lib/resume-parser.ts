import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MIN_RESUME_TEXT_LENGTH = 80;

const supportedExtensions = new Set(["pdf", "docx", "txt", "md"]);

export class ResumeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeParseError";
  }
}

function fileExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() || "";
}

function cleanResumeText(text: string) {
  return text
    .replace(/\0/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parseResumeFile(file: File) {
  if (file.size === 0) {
    throw new ResumeParseError("The uploaded resume is empty.");
  }

  if (file.size > MAX_RESUME_SIZE) {
    throw new ResumeParseError("The resume must be smaller than 5 MB.");
  }

  const extension = fileExtension(file.name);
  if (!supportedExtensions.has(extension)) {
    throw new ResumeParseError(
      "Upload a PDF, DOCX, TXT, or Markdown resume.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";

  try {
    if (extension === "pdf") {
      extractedText = await extractPdfText(buffer);
    } else if (extension === "docx") {
      extractedText = await extractDocxText(buffer);
    } else {
      extractedText = buffer.toString("utf8");
    }
  } catch (error) {
    console.error(`Could not parse ${extension} resume:`, error);

    if (
      extension === "pdf" &&
      error instanceof Error &&
      /password|encrypted/i.test(error.message)
    ) {
      throw new ResumeParseError(
        "This PDF is password-protected. Remove the password or upload a DOCX version.",
      );
    }

    throw new ResumeParseError(
      extension === "pdf"
        ? "CareerAgent could not read this PDF. Try exporting it again as a standard text-based PDF or upload a DOCX version."
        : `CareerAgent could not read this ${extension.toUpperCase()} file.`,
    );
  }

  const text = cleanResumeText(extractedText);
  if (text.length < MIN_RESUME_TEXT_LENGTH) {
    throw new ResumeParseError(
      extension === "pdf"
        ? "This PDF has very little selectable text. If it is scanned, export it as a text-based PDF or DOCX."
        : "The uploaded file does not contain enough resume text.",
    );
  }

  return {
    text,
    fileName: file.name,
    fileType: extension,
    characterCount: text.length,
  };
}
