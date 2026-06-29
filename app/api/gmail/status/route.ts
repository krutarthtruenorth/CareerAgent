import { auth } from "@/auth";

export async function GET() {
  const configured = Boolean(
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.AUTH_SECRET,
  );

  if (!configured) {
    return Response.json({ configured: false, connected: false });
  }

  const session = await auth();

  return Response.json({
    configured: true,
    connected: Boolean(session?.user?.email),
    email: session?.user?.email ?? null,
  });
}
