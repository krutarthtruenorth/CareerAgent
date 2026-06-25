"use client";

import { useState } from "react";
import type { TailoredResult } from "@/lib/career-agent";

type TailoredJobResultProps = {
  result: TailoredResult;
  index: number;
};

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "blocked">(
    "idle",
  );

  function copyWithFallback(value: string) {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const copiedSuccessfully = document.execCommand("copy");
    textArea.remove();

    if (!copiedSuccessfully) {
      throw new Error("Copy command was unavailable.");
    }
  }

  async function copy() {
    let copySucceeded = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copySucceeded = true;
      } else {
        copyWithFallback(text);
        copySucceeded = true;
      }
    } catch {
      try {
        copyWithFallback(text);
        copySucceeded = true;
      } catch {
        copySucceeded = false;
      }
    }

    setCopyState(copySucceeded ? "copied" : "blocked");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-full border border-[#d7e1da] bg-white px-3 py-1.5 text-xs font-semibold text-[#435049] transition hover:border-[#a9c9b5] hover:text-[#216e4e]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </svg>
      {copyState === "copied"
        ? "Copied"
        : copyState === "blocked"
          ? "Copy unavailable"
          : label}
    </button>
  );
}

export function TailoredJobResult({
  result,
  index,
}: TailoredJobResultProps) {
  return (
    <article
      className="message-in overflow-hidden rounded-[24px] border border-[#dae4dd] bg-white/90 shadow-[0_16px_50px_rgba(37,58,46,0.08)] backdrop-blur"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <header className="border-b border-[#e5ebe7] px-5 py-5 sm:px-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6d7a72]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf5ee] text-[10px] text-[#216e4e]">
                {index + 1}
              </span>
              Tailored application
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#18251e]">
              {result.jobTitle}
            </h2>
            <p className="mt-1 text-sm text-[#667169]">
              {result.company} <span className="mx-1.5 text-[#b1bbb4]">·</span>{" "}
              {result.location}
            </p>
          </div>
          <a
            href={result.absoluteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f1f5f2] px-3 py-1.5 text-xs font-semibold text-[#435049] transition hover:bg-[#e8f0ea] hover:text-[#216e4e]"
          >
            View role
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {result.matchReason.map((reason) => (
            <span
              key={reason}
              className="rounded-full border border-[#d3e7da] bg-[#f0f8f3] px-3 py-1.5 text-xs font-medium text-[#2a6b4e]"
            >
              ✓ {reason}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-7 px-5 py-6 sm:px-7 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-7">
          <section>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#7a857e]">
              Tailored summary
            </h3>
            <p className="text-sm leading-6 text-[#455149]">
              {result.tailoredSummary}
            </p>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a857e]">
                Resume bullets
              </h3>
              <CopyButton
                label="Copy tailored bullets"
                text={result.tailoredBullets.map((bullet) => `• ${bullet}`).join("\n")}
              />
            </div>
            <ul className="space-y-2.5">
              {result.tailoredBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-2.5 text-sm leading-6 text-[#455149]"
                >
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4d9a73]" />
                  {bullet}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e1e7e2] bg-[#fafbf9] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a857e]">
                Draft email
              </h3>
              <CopyButton
                label="Copy email"
                text={`Subject: ${result.applicationEmail.subject}\n\n${result.applicationEmail.body}`}
              />
            </div>
            <p className="border-b border-[#e4e9e5] pb-3 text-sm font-semibold text-[#28342d]">
              {result.applicationEmail.subject}
            </p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#566159]">
              {result.applicationEmail.body}
            </p>
          </section>

          <section className="rounded-2xl border border-[#eadfbd] bg-[#fffaf0] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#79662f]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m9 12 2 2 4-4" />
                <path d="M12 3 4.5 6v5.2c0 4.6 3.2 8.9 7.5 9.8 4.3-.9 7.5-5.2 7.5-9.8V6L12 3Z" />
              </svg>
              Honesty check
            </h3>
            <ul className="space-y-2">
              {result.honestyCheck.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-xs leading-5 text-[#6a603f]"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#b2933d]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
