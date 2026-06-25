import type { Job } from "@/lib/career-agent";

type GreenhouseBoard = {
  token: string;
  company: string;
};

type GreenhouseListJob = {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  updated_at?: string;
  company_name?: string;
};

type GreenhouseJobDetail = GreenhouseListJob & {
  content: string;
};

type BoardSearchResult = {
  board: GreenhouseBoard;
  jobs: GreenhouseListJob[];
};

const DEFAULT_BOARDS: GreenhouseBoard[] = [
  { token: "anthropic", company: "Anthropic" },
  { token: "scaleai", company: "Scale AI" },
  { token: "discord", company: "Discord" },
  { token: "figma", company: "Figma" },
];

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "role",
  "the",
  "to",
]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBoardsFromEnvironment() {
  const configuredBoards = process.env.GREENHOUSE_BOARDS;
  if (!configuredBoards) return DEFAULT_BOARDS;

  const boards = configuredBoards
    .split(",")
    .map((entry) => {
      const [token, company] = entry.split(":").map((part) => part.trim());
      return token
        ? { token, company: company || token }
        : null;
    })
    .filter((board): board is GreenhouseBoard => Boolean(board));

  return boards.length > 0 ? boards : DEFAULT_BOARDS;
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      namedEntities[name.toLowerCase()] ?? entity,
    );
}

function descriptionToText(content: string) {
  const decodedContent = decodeHtml(content);

  return decodeHtml(
    decodedContent
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 24_000);
}

function roleScore(title: string, role: string) {
  const normalizedTitle = normalize(title);
  const normalizedRole = normalize(role);
  const titleTerms = normalizedTitle.split(" ");
  const terms = normalizedRole
    .split(" ")
    .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));

  if (terms.length === 0) return 1;

  const matchedTerms = terms.filter((term) =>
    titleTerms.some(
      (titleTerm) =>
        titleTerm === term ||
        (term.length > 4 && titleTerm.startsWith(term)),
    ),
  );
  const minimumMatches = Math.ceil(terms.length * 0.66);
  if (matchedTerms.length < minimumMatches) return 0;

  const phraseBonus = normalizedTitle.includes(normalizedRole) ? 12 : 0;
  const coverage = matchedTerms.length / terms.length;
  const matchedPositions = terms
    .map((term) =>
      titleTerms.findIndex(
        (titleTerm) =>
          titleTerm === term ||
          (term.length > 4 && titleTerm.startsWith(term)),
      ),
    )
    .filter((position) => position >= 0);
  const proximityBonus =
    matchedPositions.length > 1
      ? Math.max(
          0,
          8 -
            (Math.max(...matchedPositions) - Math.min(...matchedPositions)) * 2,
        )
      : 0;
  const engineeringBonus =
    titleTerms.some((term) => term.startsWith("engineer")) &&
    terms.includes("engineer")
      ? 3
      : 0;

  return (
    phraseBonus +
    coverage * 10 +
    matchedTerms.length +
    proximityBonus +
    engineeringBonus
  );
}

function locationMatches(jobLocation: string, location: string) {
  const normalizedQuery = normalize(location);
  if (!normalizedQuery) return true;

  const normalizedLocation = normalize(jobLocation);
  const terms = normalizedQuery
    .split(" ")
    .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));

  return (
    normalizedLocation.includes(normalizedQuery) ||
    terms.every((term) => normalizedLocation.includes(term))
  );
}

async function fetchBoardJobs(
  board: GreenhouseBoard,
): Promise<BoardSearchResult> {
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.token)}/jobs`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Greenhouse board ${board.token} returned ${response.status}.`);
  }

  const payload = (await response.json()) as { jobs?: GreenhouseListJob[] };
  return { board, jobs: Array.isArray(payload.jobs) ? payload.jobs : [] };
}

async function fetchJobDetail(
  match: GreenhouseListJob & { board: GreenhouseBoard },
): Promise<Job> {
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(match.board.token)}/jobs/${match.id}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Greenhouse job ${match.id} returned ${response.status}.`);
  }

  const detail = (await response.json()) as GreenhouseJobDetail;

  return {
    id: `${match.board.token}_${detail.id}`,
    title: detail.title,
    company: detail.company_name || match.board.company,
    location: detail.location?.name || "Location not listed",
    absolute_url: detail.absolute_url,
    content: descriptionToText(detail.content || detail.title),
  };
}

export async function searchGreenhouseJobs(role: string, location: string) {
  const boards = parseBoardsFromEnvironment();
  const boardResults = await Promise.allSettled(boards.map(fetchBoardJobs));
  const availableBoards = boardResults
    .filter(
      (result): result is PromiseFulfilledResult<BoardSearchResult> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  if (availableBoards.length === 0) {
    throw new Error("No configured Greenhouse boards are currently available.");
  }

  const rankedMatches = availableBoards
    .flatMap(({ board, jobs }) =>
      jobs.map((job) => ({
        ...job,
        board,
        score: roleScore(job.title, role),
      })),
    )
    .filter(
      (job) =>
        job.score > 0 &&
        locationMatches(job.location?.name || "", location),
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        Date.parse(b.updated_at || "1970-01-01") -
        Date.parse(a.updated_at || "1970-01-01")
      );
    })
    .slice(0, 5);

  const detailResults = await Promise.allSettled(
    rankedMatches.map(fetchJobDetail),
  );
  const jobs = detailResults
    .filter(
      (result): result is PromiseFulfilledResult<Job> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  return {
    jobs,
    searchedBoards: availableBoards.map(({ board }) => board.company),
  };
}
