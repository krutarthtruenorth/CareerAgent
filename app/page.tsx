"use client";

import { useState } from "react";
import { AgentMessage } from "@/components/AgentMessage";
import { TailoredJobResult } from "@/components/TailoredJobResult";
import type { Job, TailoredResult } from "@/lib/career-agent";
import { buildAgentSteps, buildFinalMessage } from "@/lib/prompts";

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
  const [role, setRole] = useState("AI Engineer");
  const [location, setLocation] = useState("San Francisco, CA");
  const [submittedSearch, setSubmittedSearch] = useState({
    role: "",
    location: "",
  });
  const [searchedBoards, setSearchedBoards] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeInputKey, setResumeInputKey] = useState(0);

  async function runCareerAgent() {
    const cleanRole = role.trim();
    const cleanLocation = location.trim();
    if (!cleanRole) {
      setError("Add a role before running CareerAgent.");
      setRunState("error");
      return;
    }
    if (!resumeFile) {
      setError("Upload your resume before running CareerAgent.");
      setRunState("error");
      return;
    }

    const agentSteps = buildAgentSteps(cleanRole, cleanLocation);
    setRunState("running");
    setVisibleSteps([]);
    setResults([]);
    setError("");
    setSearchedBoards([]);
    setSubmittedSearch({ role: cleanRole, location: cleanLocation });

    try {
      setVisibleSteps([agentSteps[0]]);
      const searchParams = new URLSearchParams({
        role: cleanRole,
        location: cleanLocation,
      });
      const jobsResponse = await fetch(`/api/jobs?${searchParams.toString()}`);
      const jobsData = (await jobsResponse.json()) as {
        jobs?: Job[];
        error?: string;
        searchedBoards?: string[];
      };
      if (!jobsResponse.ok || !jobsData.jobs) {
        throw new Error(jobsData.error ?? "I couldn’t load live jobs.");
      }
      setSearchedBoards(jobsData.searchedBoards ?? []);

      await wait(550);
      setVisibleSteps((steps) => [...steps, agentSteps[1]]);
      await wait(600);
      setVisibleSteps((steps) => [...steps, agentSteps[2]]);

      const tailorFormData = new FormData();
      tailorFormData.append("jobs", JSON.stringify(jobsData.jobs));
      tailorFormData.append("resume", resumeFile);

      const tailorResponse = await fetch("/api/tailor", {
        method: "POST",
        body: tailorFormData,
      });
      if (!tailorResponse.ok) {
        const payload = (await tailorResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "I couldn’t tailor the applications.");
      }

      await wait(650);
      setVisibleSteps((steps) => [...steps, agentSteps[3]]);
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
          {resumeFile ? "Resume ready" : "Resume required"}
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
              each one, and draft the outreach. Upload your resume first, and
              I’ll use only the experience contained in that file.
            </AgentMessage>

            {(runState !== "idle" || results.length > 0) && (
              <AgentMessage tone="user">
                Find {submittedSearch.role} roles
                {submittedSearch.location
                  ? ` in ${submittedSearch.location}`
                  : ""}{" "}
                and tailor my resume.
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
              <AgentMessage tone="success">
                {buildFinalMessage(results.length)}
              </AgentMessage>
            )}

            {runState === "error" && (
              <div className="rounded-2xl border border-[#efcfca] bg-[#fff5f3] px-4 py-3 text-sm text-[#9a4035]">
                {error} Please try again.
              </div>
            )}
          </div>

          <div className="border-t border-[#e5ebe7] bg-[#fbfcfa] p-4 sm:p-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void runCareerAgent();
              }}
              className="rounded-2xl border border-[#dce4de] bg-white p-2 shadow-sm"
            >
              <div className="mb-2 rounded-xl border border-dashed border-[#cbd9cf] bg-[#f8fbf9] p-3">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#65736a]">
                      Your resume
                    </span>
                    <p className="mt-1 truncate text-sm font-medium text-[#314038]">
                      {resumeFile
                        ? resumeFile.name
                        : "Upload PDF, DOCX, TXT, or Markdown"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#849087]">
                      Max 5 MB · processed for this request only
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {resumeFile && (
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() => {
                          setResumeFile(null);
                          setResumeInputKey((key) => key + 1);
                        }}
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-[#69766e] transition hover:bg-white hover:text-[#9a4035]"
                      >
                        Remove
                      </button>
                    )}
                    <label className="cursor-pointer rounded-lg border border-[#cad8ce] bg-white px-3 py-2 text-xs font-semibold text-[#276849] shadow-sm transition hover:border-[#9fc0ab] hover:text-[#185137]">
                      {resumeFile ? "Replace file" : "Choose file"}
                      <input
                        key={resumeInputKey}
                        type="file"
                        accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                        disabled={isRunning}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (file && file.size > 5 * 1024 * 1024) {
                            setError("The resume must be smaller than 5 MB.");
                            setRunState("error");
                            event.target.value = "";
                            return;
                          }
                          setResumeFile(file);
                          setError("");
                          if (runState === "error") setRunState("idle");
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="rounded-xl border border-transparent px-3 py-2 transition focus-within:border-[#bdd8c7] focus-within:bg-[#f8fbf9]">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d8981]">
                    Role
                  </span>
                  <input
                    type="text"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    disabled={isRunning}
                    maxLength={100}
                    placeholder="AI Engineer"
                    className="mt-1 w-full bg-transparent text-sm text-[#253129] outline-none placeholder:text-[#a0aaa3]"
                  />
                </label>
                <label className="rounded-xl border border-transparent px-3 py-2 transition focus-within:border-[#bdd8c7] focus-within:bg-[#f8fbf9]">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d8981]">
                    Location
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    disabled={isRunning}
                    maxLength={100}
                    placeholder="San Francisco, CA or Remote"
                    className="mt-1 w-full bg-transparent text-sm text-[#253129] outline-none placeholder:text-[#a0aaa3]"
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#edf1ee] px-2 pt-2">
                <p className="hidden text-xs text-[#89928d] sm:block">
                  Live Greenhouse jobs · uploaded resume only
                </p>
              <button
                type="submit"
                disabled={isRunning || !resumeFile}
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
            </form>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#7a867e]">
          <span>✓ Live Greenhouse roles</span>
          <span>✓ PDF and DOCX support</span>
          <span>✓ Uploaded resume only</span>
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
                {results.length} live{" "}
                {results.length === 1 ? "application" : "applications"}, ready
                to review.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#6c776f]">
              Sourced from {searchedBoards.join(", ")}. Each draft emphasizes
              a different part of your real experience based on what the role
              asks for.
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
