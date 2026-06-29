import { google } from "googleapis";

type GmailToken = Record<string, unknown> & {
  accessToken?: unknown;
  refreshToken?: unknown;
  accessTokenExpires?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

export async function getGmailAccessToken(token: GmailToken) {
  const accessToken = asString(token.accessToken);
  const refreshToken = asString(token.refreshToken);
  const expiresAt = asNumber(token.accessTokenExpires);

  if (accessToken && (!expiresAt || Date.now() < expiresAt - 30_000)) {
    return accessToken;
  }

  if (
    !refreshToken ||
    !process.env.AUTH_GOOGLE_ID ||
    !process.env.AUTH_GOOGLE_SECRET
  ) {
    throw new Error("Gmail authorization has expired. Reconnect Gmail.");
  }

  const oauthClient = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );
  oauthClient.setCredentials({ refresh_token: refreshToken });
  const credentials = await oauthClient.refreshAccessToken();

  if (!credentials.credentials.access_token) {
    throw new Error("Google did not return a new Gmail access token.");
  }

  return credentials.credentials.access_token;
}

function encodeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildMimeMessage({
  to,
  subject,
  body,
  attachment,
  attachmentName,
}: {
  to?: string;
  subject: string;
  body: string;
  attachment: Buffer;
  attachmentName: string;
}) {
  const boundary = `careeragent_${crypto.randomUUID().replace(/-/g, "")}`;
  const lines = [
    ...(to ? [`To: ${encodeHeader(to)}`] : []),
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    "",
    `--${boundary}`,
    "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${encodeHeader(attachmentName)}"`,
    "",
    attachment.toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "",
    `--${boundary}--`,
  ];

  return base64Url(lines.join("\r\n"));
}

export async function createGmailDraft({
  accessToken,
  to,
  subject,
  body,
  attachment,
  attachmentName,
}: {
  accessToken: string;
  to?: string;
  subject: string;
  body: string;
  attachment: Buffer;
  attachmentName: string;
}) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });
  const raw = buildMimeMessage({
    to,
    subject,
    body,
    attachment,
    attachmentName,
  });

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw } },
  });

  return {
    draftId: response.data.id,
    messageId: response.data.message?.id,
    gmailUrl: "https://mail.google.com/mail/u/0/#drafts",
  };
}
