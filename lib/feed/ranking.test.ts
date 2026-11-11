import { describe, expect, it } from "vitest";
import { type FeedCandidate, rankFeed } from "./ranking";

const now = new Date("2026-11-11T12:00:00.000Z");

function candidate(overrides: Partial<FeedCandidate> = {}): FeedCandidate {
  return {
    id: "post-1",
    authorId: "author-1",
    createdAt: "2026-11-11T11:00:00.000Z",
    contentLength: 40,
    hasCover: false,
    interestOverlap: 0,
    skillOverlap: 0,
    followsAuthor: false,
    followsProject: false,
    sameCity: false,
    sameState: false,
    seekingMatch: false,
    dismissed: false,
    seenRecently: false,
    reacted: false,
    ...overrides,
  };
}

describe("rankFeed", () => {
  it("orders a cold start by recency and caps one author at two posts", () => {
    const ranked = rankFeed(
      [
        candidate({ id: "old", authorId: "a", createdAt: "2026-11-01T12:00:00.000Z" }),
        candidate({ id: "new", authorId: "b", createdAt: "2026-11-11T11:30:00.000Z" }),
        candidate({ id: "a1", authorId: "a", createdAt: "2026-11-11T10:00:00.000Z" }),
        candidate({ id: "a2", authorId: "a", createdAt: "2026-11-11T09:00:00.000Z" }),
        candidate({ id: "a3", authorId: "a", createdAt: "2026-11-11T08:00:00.000Z" }),
      ],
      { now, coldStart: true },
    );
    expect(ranked.map((item) => item.id)).toEqual(["new", "a1", "a2"]);
    expect(ranked[0]?.reason).toBe("Shown because you're new here. Add interests and it will sharpen.");
    expect(ranked.filter((item) => item.authorId === "a")).toHaveLength(2);
  });

  it("lets a skill match outrank a newer unrelated post", () => {
    const ranked = rankFeed(
      [
        candidate({ id: "new", createdAt: "2026-11-11T11:30:00.000Z" }),
        candidate({ id: "match", authorId: "skill-author", createdAt: "2026-11-10T12:00:00.000Z", skillOverlap: 1 }),
      ],
      { now, coldStart: false },
    );
    expect(ranked[0]?.id).toBe("match");
    expect(ranked[0]?.reason).toBe("Uses skills from your profile.");
  });

  it("drops a dismissed post and lowers one the viewer already saw", () => {
    const ranked = rankFeed(
      [
        candidate({ id: "dismissed", dismissed: true, followsAuthor: true }),
        candidate({ id: "seen", seenRecently: true, followsAuthor: true }),
        candidate({ id: "fresh", followsAuthor: true }),
      ],
      { now, coldStart: false },
    );
    expect(ranked.map((item) => item.id)).toEqual(["fresh", "seen"]);
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });
});
