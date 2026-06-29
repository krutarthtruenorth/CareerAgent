"use client";

import { connectGmail, disconnectGmail } from "@/app/actions/gmail";

export function GmailConnection({
  configured,
  connected,
  email,
}: {
  configured: boolean;
  connected: boolean;
  email?: string | null;
}) {
  if (!configured) {
    return (
      <span className="text-xs text-[#8a645c]">
        Gmail setup required in `.env.local`
      </span>
    );
  }

  if (connected) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="max-w-48 truncate text-xs text-[#536159]">
          Gmail: {email}
        </span>
        <form action={disconnectGmail}>
          <button
            type="submit"
            className="rounded-full border border-[#d8e1da] bg-white px-3 py-1.5 text-xs font-semibold text-[#657169] transition hover:text-[#9a4035]"
          >
            Disconnect
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={connectGmail}>
      <button
        type="submit"
        className="rounded-full border border-[#d2ddd5] bg-white px-3 py-1.5 text-xs font-semibold text-[#276849] shadow-sm transition hover:border-[#9fc0ab]"
      >
        Connect Gmail
      </button>
    </form>
  );
}
