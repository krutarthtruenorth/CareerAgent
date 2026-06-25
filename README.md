# CareerAgent

**Apply through conversation, not dashboards.**

CareerAgent is a hackathon MVP that replaces the traditional job application dashboard with a conversational workflow. Instead of tracking jobs in tables, users ask an agent to find relevant roles, tailor their resume, and draft application emails.

## Problem

Job seekers already spend too much time switching between job boards, resume editors, trackers, and email drafts. Conventional job-search products often add another dashboard to maintain.

## Solution

CareerAgent creates one simple agent-style flow:

1. Search live public Greenhouse boards by role and location.
2. Read a static master resume.
3. Match the candidate's existing experience to each role.
4. Produce a tailored summary, resume bullets, and application email.
5. Explain what was changed through an honesty check.

The entire experience is presented as a conversation and a set of agent handoffs—not a tracking table, kanban board, or analytics screen.

## Tech stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Next.js route handlers
- Greenhouse Job Board API and static Markdown resume data
- Deterministic local tailoring with no API key required

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Run CareerAgent**.

To validate a production build:

```bash
npm run lint
npm run build
```

## MVP features

- Role and location search
- Live jobs from public Greenhouse boards
- Static master resume
- Deterministic keyword and capability matching
- Tailored professional summary and resume bullets
- Draft application email for every role
- Grounding and honesty check
- Copy buttons for bullets and emails
- Loading sequence and error states
- No authentication, database, or dashboard

## Project structure

```text
app/
  api/jobs/route.ts
  api/tailor/route.ts
  page.tsx
components/
  AgentMessage.tsx
  TailoredJobResult.tsx
data/
  resume.md
  fallback-jobs.json
lib/
  career-agent.ts
  prompts.ts
```

## Future improvements

- Optional OpenAI-powered tailoring behind the deterministic generator
- More configurable Greenhouse company boards
- Resume upload and editable agent instructions
- Export tailored material as PDF or DOCX
- User approval before sending any application
- Voice input for the conversational prompt

CareerAgent intentionally does not include authentication, profiles, a database, saved-job tracking, analytics, or a conventional dashboard. The demo stays focused on its core idea: ask once, review thoughtful application materials, and move forward.

## Greenhouse configuration

Greenhouse exposes jobs one company board at a time rather than through a
global job-search endpoint. CareerAgent searches a small set of real public
boards by default: Anthropic, Scale AI, Discord, and Figma.

You can replace or extend that set with an environment variable:

```bash
GREENHOUSE_BOARDS="anthropic:Anthropic,scaleai:Scale AI,figma:Figma"
```

Each item uses the format `board-token:Company Name`. The board token is the
identifier in a company’s Greenhouse job-board URL. No Greenhouse API key is
required for these public read-only endpoints.
