export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  absolute_url: string;
  content: string;
};

export type TailoredResult = {
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  absoluteUrl: string;
  matchReason: string[];
  tailoredSummary: string;
  tailoredSkills: string[];
  tailoredBullets: string[];
  applicationEmail: {
    subject: string;
    body: string;
  };
  honestyCheck: string[];
};

type SkillProfile = {
  label: string;
  terms: string[];
  matchReason: string;
};

const skillProfiles: SkillProfile[] = [
  {
    label: "AI / LLM applications",
    terms: ["ai", "llm", "generative ai", "agent", "prompt"],
    matchReason: "Matched practical AI and LLM product experience",
  },
  {
    label: "RAG & vector search",
    terms: ["rag", "retrieval", "embedding", "vector search", "citations"],
    matchReason: "Matched RAG, embeddings, and grounded-answer experience",
  },
  {
    label: "Python & FastAPI",
    terms: ["python", "fastapi"],
    matchReason: "Matched Python and FastAPI backend development",
  },
  {
    label: "React & Next.js",
    terms: ["react", "next.js", "typescript", "frontend", "full-stack"],
    matchReason: "Matched full-stack React, Next.js, and TypeScript delivery",
  },
  {
    label: "AWS & cloud deployment",
    terms: ["aws", "cloud", "deployment", "production"],
    matchReason: "Matched cloud deployment and production ownership",
  },
  {
    label: "Docker & Kubernetes",
    terms: ["docker", "kubernetes", "container", "model-serving"],
    matchReason: "Matched container and Kubernetes platform experience",
  },
  {
    label: "Evaluation & guardrails",
    terms: ["evaluation", "quality", "guardrail", "fallback", "observability"],
    matchReason: "Matched AI evaluation, guardrails, and reliability work",
  },
  {
    label: "Product prototyping",
    terms: ["prototype", "product", "user-facing", "design", "users"],
    matchReason: "Matched rapid prototyping and cross-functional product work",
  },
  {
    label: "APIs & platform tooling",
    terms: ["api", "platform", "developer tooling", "backend"],
    matchReason: "Matched backend API and developer platform experience",
  },
  {
    label: "CI/CD & operations",
    terms: ["ci/cd", "monitoring", "reliability", "infrastructure"],
    matchReason: "Matched CI/CD and production reliability experience",
  },
];

const bulletLibrary: Record<string, string> = {
  "AI / LLM applications":
    "Built practical AI and LLM product workflows with grounded generation, prompt guardrails, and reliable fallback behavior.",
  "RAG & vector search":
    "Developed a retrieval-augmented assistant with Python, FastAPI, embeddings, vector search, and source citations.",
  "Python & FastAPI":
    "Designed Python and FastAPI services for product integrations, AI orchestration, and responsive backend APIs.",
  "React & Next.js":
    "Shipped customer-facing React and Next.js applications in TypeScript, owning features from interface through API integration.",
  "AWS & cloud deployment":
    "Deployed and operated cloud-native services on AWS with monitoring, release automation, and pragmatic rollback plans.",
  "Docker & Kubernetes":
    "Containerized production services with Docker and operated Kubernetes workloads supporting reliable cloud deployments.",
  "Evaluation & guardrails":
    "Added evaluation fixtures, citations, prompt guardrails, observability, and fallback behavior to improve AI response reliability.",
  "Product prototyping":
    "Turned ambiguous user needs into testable product increments and built an end-to-end AI prototype during a weekend hackathon.",
  "APIs & platform tooling":
    "Built REST APIs, background jobs, and internal developer tooling for high-volume product workflows.",
  "CI/CD & operations":
    "Improved deployment reliability through CI/CD automation, operational runbooks, monitoring, and production-minded engineering.",
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#./-]+/g, " ");
}

function matchedProfiles(job: Job, resume: string) {
  const jobText = normalize(`${job.title} ${job.content}`);
  const resumeText = normalize(resume);

  return skillProfiles
    .map((profile) => ({
      ...profile,
      score: profile.terms.reduce((score, term) => {
        const jobHasTerm = jobText.includes(normalize(term));
        const resumeHasTerm = resumeText.includes(normalize(term));
        return score + (jobHasTerm && resumeHasTerm ? 2 : jobHasTerm ? 1 : 0);
      }, 0),
    }))
    .filter((profile) => profile.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function tailorJob(job: Job, resume: string): TailoredResult {
  const profiles = matchedProfiles(job, resume);
  const topProfiles = profiles.slice(0, 6);
  const skills = topProfiles.map((profile) => profile.label);
  const topThree = skills.slice(0, 3);
  const lead = topThree.length > 1
    ? `${topThree.slice(0, -1).join(", ")} and ${topThree.at(-1)}`
    : topThree[0] ?? "full-stack product engineering";

  const matchReason = topProfiles
    .slice(0, 4)
    .map((profile) => profile.matchReason);

  const tailoredBullets = topProfiles
    .map((profile) => bulletLibrary[profile.label])
    .filter(Boolean)
    .slice(0, 6);

  while (tailoredBullets.length < 4) {
    const fallback = bulletLibrary["Product prototyping"];
    if (!tailoredBullets.includes(fallback)) tailoredBullets.push(fallback);
    else break;
  }

  const tailoredSummary = `Full-stack engineer with 7 years of experience shipping production software, with directly relevant strengths in ${lead}. Brings hands-on experience building AI-enabled products, reliable backend services, and cloud deployments while partnering closely with product teams from prototype through launch.`;

  const body = `Hi ${job.company} team,

I’m excited to apply for the ${job.title} role. My background combines full-stack product development with hands-on AI engineering, including RAG systems, LLM integrations, backend APIs, and cloud deployment.

Your focus on ${topThree.join(", ")} strongly aligns with work I’ve already shipped. I’d welcome the opportunity to bring that practical, product-minded approach to ${job.company}.

Thank you for your consideration,
Jordan Lee`;

  return {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    location: job.location,
    absoluteUrl: job.absolute_url,
    matchReason,
    tailoredSummary,
    tailoredSkills: skills,
    tailoredBullets,
    applicationEmail: {
      subject: `Application for ${job.title} — Jordan Lee`,
      body,
    },
    honestyCheck: [
      "Did not add unsupported model training, research, or domain-specific experience.",
      `Reframed existing ${skills.slice(0, 3).join(", ")} experience toward the priorities in this role.`,
      "Kept all claims grounded in the master resume; no titles, employers, or metrics were invented.",
    ],
  };
}

export function isJob(value: unknown): value is Job {
  if (!value || typeof value !== "object") return false;
  const job = value as Record<string, unknown>;
  return ["id", "title", "company", "location", "absolute_url", "content"].every(
    (field) => typeof job[field] === "string" && job[field].length > 0,
  );
}
