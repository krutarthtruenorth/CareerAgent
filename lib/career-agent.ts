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

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#./-]+/g, " ");
}

function matchedProfiles(job: Job, resume: string) {
  const jobText = normalize(`${job.title} ${job.content}`);
  const resumeText = normalize(resume);

  return skillProfiles
    .map((profile) => ({
      ...profile,
      score: profile.terms.filter((term) => {
        const normalizedTerm = normalize(term);
        return (
          jobText.includes(normalizedTerm) &&
          resumeText.includes(normalizedTerm)
        );
      }).length,
    }))
    .filter((profile) => profile.score > 0)
    .sort((a, b) => b.score - a.score);
}

function resumeLines(resume: string) {
  const lines = resume
    .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*•]\s+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length >= 30 && line.length <= 420);

  return [...new Set(lines)];
}

function relevantResumeBullets(job: Job, resume: string, profiles: SkillProfile[]) {
  const jobText = normalize(`${job.title} ${job.content}`);
  const jobTerms = [...new Set(jobText.split(" ").filter((term) => term.length > 3))];
  const profileTerms = profiles.flatMap((profile) => profile.terms.map(normalize));

  return resumeLines(resume)
    .map((line, index) => {
      const normalizedLine = normalize(line);
      const profileMatches = profileTerms.filter((term) =>
        normalizedLine.includes(term),
      ).length;
      const jobMatches = jobTerms.filter((term) =>
        normalizedLine.includes(term),
      ).length;

      return {
        line,
        index,
        score: profileMatches * 4 + jobMatches,
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6)
    .map(({ line }) => line);
}

export function tailorJob(job: Job, resume: string): TailoredResult {
  const profiles = matchedProfiles(job, resume);
  const topProfiles = profiles.slice(0, 6);
  const skills = topProfiles.map((profile) => profile.label);
  const topThree = skills.slice(0, 3);
  const lead = topThree.length > 1
    ? `${topThree.slice(0, -1).join(", ")} and ${topThree.at(-1)}`
    : topThree[0] ?? "full-stack product engineering";

  const matchReason =
    topProfiles.length > 0
      ? topProfiles.slice(0, 4).map((profile) => profile.matchReason)
      : ["Matched transferable experience directly from the uploaded resume"];

  const tailoredBullets = relevantResumeBullets(job, resume, topProfiles);

  const tailoredSummary =
    topThree.length > 0
      ? `Candidate with experience relevant to ${job.title}, including ${lead}. This positioning reflects capabilities explicitly present in the uploaded resume and emphasizes the areas most aligned with ${job.company}’s role.`
      : `Candidate whose uploaded resume contains transferable experience relevant to the ${job.title} role. The selected resume content is prioritized against the job description without adding unsupported skills or experience.`;

  const emailStrengths =
    topThree.length > 0
      ? topThree.join(", ")
      : "the responsibilities described in the role";

  const body = `Hi ${job.company} team,

I’m excited to apply for the ${job.title} role. My uploaded resume includes experience relevant to ${emailStrengths}.

The role’s focus aligns with work and capabilities already reflected in my resume. I’d welcome the opportunity to discuss how that experience could contribute to ${job.company}.

Thank you for your consideration,
Candidate`;

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
      "Used the uploaded resume as the only source of candidate experience.",
      skills.length > 0
        ? `Prioritized existing ${skills.slice(0, 3).join(", ")} experience for this role.`
        : "Prioritized the most relevant transferable statements from the uploaded resume.",
      "Did not invent skills, titles, employers, dates, metrics, or accomplishments.",
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
