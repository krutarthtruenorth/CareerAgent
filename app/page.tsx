"use client";

import { useState } from "react";
import { AgentMessage } from "@/components/AgentMessage";
import { TailoredJobResult } from "@/components/TailoredJobResult";
import type { Job, TailoredResult } from "@/lib/career-agent";
import { AGENT_STEPS, FINAL_MESSAGE } from "@/lib/prompts";

type RunState = "idle" | "running" | "done" | "error";

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#1d6045] text-white shadow-[0_8px_20px_rgba(29,96,69,0.22)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 2.75c.7 5.25 4 8.55 9.25 9.25C16 12.7 12.7 16 12 21.25 11.3 16 8 12.7 2.75 12 8 11.3 11.3 8 12 2.75Z" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [runState, setRunState] = useState<RunState>("idle");
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);
  const [results, setResults] = useState<TailoredResult[]>([]);
  const [error, setError] = useState("");

  async function runCareerAgent() {
    setRunState("running");
    setVisibleSteps([]);
    setResults([]);
    setError("");

    try {
      setVisibleSteps([AGENT_STEPS[0]]);
      const jobsResponse = await fetch("/api/jobs");
      if (!jobsResponse.ok) throw new Error("I couldn’t load the job list.");
      const jobsData = (await jobsResponse.json()) as { jobs: Job[] };

      await wait(550);
      setVisibleSteps((steps) => [...steps, AGENT_STEPS[1]]);
      await wait(600);
      setVisibleSteps((steps) => [...steps, AGENT_STEPS[2]]);

      const tailorResponse = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: jobsData.jobs }),
      });
      if (!tailorResponse.ok) {
        const payload = (await tailorResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "I couldn’t tailor the applications.");
      }

      await wait(650);
      setVisibleSteps((steps) => [...steps, AGENT_STEPS[3]]);
      const tailorData = (await tailorResponse.json()) as {
        results: TailoredResult[];
      };
      await wait(750);
      setResults(tailorData.results);
      setRunState("done");
      window.setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while preparing the applications.",
      );
      setRunState("error");
    }
  }

  const isRunning = runState === "running";

  return (
    <main className="relative overflow-hidden pb-24">
      <div className="soft-grid pointer-events-none absolute inset-x-0 top-0 h-[680px]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="CareerAgent home">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.025em]">
            CareerAgent
          </span>
        </a>
        <div className="flex items-center gap-2 rounded-full border border-[#dbe4de] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#647069] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#41a16f]" />
          Resume grounded
        </div>
      </nav>

      <section className="relative mx-auto max-w-4xl px-5 pb-12 pt-12 text-center sm:px-8 sm:pt-20">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#d5e2d9] bg-white/75 px-3.5 py-2 text-xs font-semibold text-[#526158] shadow-sm backdrop-blur">
          <span className="text-[#27704f]">✦</span>
          Your job search, handled conversationally
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-[#17211b] sm:text-6xl">
          Apply through conversation,{" "}
          <span className="text-[#27704f]">not dashboards.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#657169] sm:text-lg">
          CareerAgent reads jobs, compares them against your resume, and
          prepares tailored application materials through a conversational
          workflow.
        </p>
      </section>

      <section className="relative mx-auto max-w-3xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[28px] border border-[#dce5df] bg-white/78 shadow-[0_28px_80px_rgba(40,62,49,0.11)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#e5ebe7] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="text-sm font-semibold">CareerAgent</p>
                <p className="text-xs text-[#748078]">Ready to work</p>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 text-xs text-[#839087] sm:flex">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 3 4.5 6v5.2c0 4.6 3.2 8.9 7.5 9.8 4.3-.9 7.5-5.2 7.5-9.8V6L12 3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Only uses experience in your resume
            </div>
          </div>

          <div className="min-h-[280px] space-y-4 px-5 py-6 sm:px-7">
            <AgentMessage>
              Hi! I can find five relevant AI roles, tailor your resume for
              each one, and draft the outreach — without making you manage
              another dashboard.
            </AgentMessage>

            {(runState !== "idle" || results.length > 0) && (
              <AgentMessage tone="user">
                Find AI Engineer roles and tailor my resume.
              </AgentMessage>
            )}

            {visibleSteps.map((step, index) => (
              <AgentMessage
                key={step}
                loading={isRunning && index === visibleSteps.length - 1}
              >
                {step}
              </AgentMessage>
            ))}

            {runState === "done" && (
              <AgentMessage tone="success">{FINAL_MESSAGE}</AgentMessage>
            )}

            {runState === "error" && (
              <div className="rounded-2xl border border-[#efcfca] bg-[#fff5f3] px-4 py-3 text-sm text-[#9a4035]">
                {error} Please try again.
              </div>
            )}
          </div>

          <div className="border-t border-[#e5ebe7] bg-[#fbfcfa] p-4 sm:p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-[#dce4de] bg-white p-2 pl-4 shadow-sm">
              <p className="min-w-0 flex-1 truncate text-sm text-[#89928d]">
                Find AI Engineer roles in San Francisco and tailor my resume.
              </p>
              <button
                type="button"
                onClick={runCareerAgent}
                disabled={isRunning}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1d6045] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(29,96,69,0.22)] transition hover:-translate-y-0.5 hover:bg-[#154f38] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 sm:px-5"
              >
                {isRunning ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Working
                  </>
                ) : (
                  <>
                    Run CareerAgent
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#7a867e]">
          <span>✓ Five realistic roles</span>
          <span>✓ Honest resume tailoring</span>
          <span>✓ Ready-to-send emails</span>
        </div>
      </section>

      {results.length > 0 && (
        <section
          id="results"
          className="relative mx-auto mt-24 max-w-6xl scroll-mt-8 px-5 sm:px-8"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#27704f]">
                Agent handoff
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Five applications, ready to review.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#6c776f]">
              Each draft emphasizes a different part of your real experience
              based on what the role asks for.
            </p>
          </div>

          <div className="space-y-7">
            {results.map((result, index) => (
              <TailoredJobResult
                key={result.jobId}
                result={result}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="relative mx-auto mt-24 max-w-6xl border-t border-[#dfe6e1] px-5 py-8 text-center text-xs text-[#7b867f] sm:px-8">
        CareerAgent · A hackathon MVP for applying through conversation.
      </footer>
    </main>
  );
}
