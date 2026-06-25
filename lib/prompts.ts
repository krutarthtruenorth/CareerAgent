export function buildAgentSteps(role: string, location: string) {
  return [
    `Searching live Greenhouse boards for ${role} roles${
      location ? ` in ${location}` : ""
    }...`,
    "Reading your master resume...",
    "Matching your experience to each live role...",
    "Generating tailored resumes and application emails...",
  ];
}

export function buildFinalMessage(resultCount: number) {
  return `I found ${resultCount} live Greenhouse ${
    resultCount === 1 ? "role" : "roles"
  }, tailored your resume, and drafted application ${
    resultCount === 1 ? "email" : "emails"
  }. I only reframed experience already present in your resume.`;
}
