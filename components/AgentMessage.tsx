type AgentMessageProps = {
  children: React.ReactNode;
  tone?: "agent" | "user" | "success";
  loading?: boolean;
};

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 2.75c.7 5.25 4 8.55 9.25 9.25C16 12.7 12.7 16 12 21.25 11.3 16 8 12.7 2.75 12 8 11.3 11.3 8 12 2.75Z" />
    </svg>
  );
}

export function AgentMessage({
  children,
  tone = "agent",
  loading = false,
}: AgentMessageProps) {
  const isUser = tone === "user";
  const isSuccess = tone === "success";

  return (
    <div
      className={`message-in flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-[#216e4e] text-white"
              : "border border-[#cfe1d5] bg-[#eaf5ee] text-[#216e4e]"
          }`}
        >
          <SparkIcon />
        </div>
      )}
      <div
        className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "rounded-tr-md bg-[#1d6045] text-white"
            : isSuccess
              ? "rounded-tl-md border border-[#bdd9c7] bg-[#eff8f2] text-[#1b4d38]"
              : "rounded-tl-md border border-[#e0e7e2] bg-white/90 text-[#435049]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{children}</span>
          {loading && (
            <span className="flex gap-1" aria-label="Working">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="agent-pulse h-1.5 w-1.5 rounded-full bg-[#4b8d6d]"
                  style={{ animationDelay: `${dot * 180}ms` }}
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
