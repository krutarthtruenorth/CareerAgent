import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerAgent — Apply through conversation",
  description:
    "A conversational career agent that tailors your resume and drafts application emails.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
