export type FeedCandidate = {
  id: string;
  authorId: string;
  createdAt: string;
  contentLength: number;
  hasCover: boolean;
  interestOverlap: number;
  skillOverlap: number;
  followsAuthor: boolean;
  followsProject: boolean;
  sameCity: boolean;
  sameState: boolean;
  seekingMatch: boolean;
  dismissed: boolean;
  seenRecently: boolean;
  reacted: boolean;
  preferAuthor: boolean;
  avoidAuthor: boolean;
  preferProject: boolean;
  avoidProject: boolean;
};

export type RankedPost = {
  id: string;
  authorId: string;
  score: number;
  reason: string;
};

const coldReason = "Shown because you're new here. Add interests and it will sharpen.";

export function rankFeed(
  candidates: FeedCandidate[],
  options: { now: Date; coldStart: boolean; limit?: number },
): RankedPost[] {
  const limit = options.limit ?? 15;
  const scored = candidates
    .filter((candidate) => !candidate.dismissed)
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, options.now, options.coldStart),
      reason: preferenceReason(candidate) ?? (options.coldStart ? coldReason : reasonFor(candidate, options.now)),
    }))
    .sort((left, right) => {
      const byScore = right.score - left.score;
      if (byScore !== 0) return byScore;
      return Date.parse(right.candidate.createdAt) - Date.parse(left.candidate.createdAt);
    });

  const seen = new Map<string, number>();
  const page: RankedPost[] = [];
  for (const item of scored) {
    const count = seen.get(item.candidate.authorId) ?? 0;
    if (count >= 2) continue;
    page.push({
      id: item.candidate.id,
      authorId: item.candidate.authorId,
      score: item.score - 10 * count,
      reason: item.reason,
    });
    seen.set(item.candidate.authorId, count + 1);
    if (page.length >= limit) break;
  }
  return page;
}

function scoreCandidate(candidate: FeedCandidate, now: Date, coldStart: boolean) {
  let score = recency(candidate.createdAt, now);
  if (!coldStart) {
    score += clamp01(candidate.interestOverlap) * 30;
    score += clamp01(candidate.skillOverlap) * 24;
    if (candidate.followsAuthor) score += 18;
    if (candidate.followsProject) score += 14;
    if (candidate.sameCity) score += 8;
    else if (candidate.sameState) score += 4;
    if (candidate.seekingMatch) score += 12;
    if (candidate.hasCover) score += 3;
    if (candidate.contentLength > 280) score += 2;
  }
  if (candidate.preferAuthor) score += 22;
  if (candidate.avoidAuthor) score -= 22;
  if (candidate.preferProject) score += 16;
  if (candidate.avoidProject) score -= 16;
  if (candidate.seenRecently) score -= 8;
  if (candidate.reacted) score -= 6;
  return score;
}

function preferenceReason(candidate: FeedCandidate) {
  if (candidate.preferAuthor || candidate.preferProject) return "You asked to see more like this.";
  return null;
}

function reasonFor(candidate: FeedCandidate, now: Date) {
  const terms = [
    {
      weight: (candidate.preferAuthor ? 22 : 0) + (candidate.preferProject ? 16 : 0),
      text: "You asked to see more like this.",
    },
    { weight: clamp01(candidate.interestOverlap) * 30, text: "Matches interests you added." },
    { weight: clamp01(candidate.skillOverlap) * 24, text: "Uses skills from your profile." },
    { weight: (candidate.followsAuthor ? 18 : 0) + (candidate.followsProject ? 14 : 0), text: "From someone you follow." },
    { weight: candidate.seekingMatch ? 12 : 0, text: "Looking for a skill you have." },
    { weight: candidate.sameCity ? 8 : 0, text: "From your city." },
    { weight: !candidate.sameCity && candidate.sameState ? 4 : 0, text: "From your state." },
    { weight: recency(candidate.createdAt, now), text: "Recently published." },
  ];
  return terms.sort((left, right) => right.weight - left.weight)[0]?.text ?? "Recently published.";
}

function recency(createdAt: string, now: Date) {
  const ageHours = Math.max(0, (now.getTime() - Date.parse(createdAt)) / 3_600_000);
  return 16 * Math.exp(-ageHours / 168);
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
