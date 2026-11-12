export type RelatedCandidate = {
  id: string;
  name: string;
  slug: string;
  subcategory: string | null;
  updatedAt: string;
  skillIds: string[];
};

export function relatedProjects(
  current: { id: string; subcategory: string | null; skillIds: string[] },
  candidates: RelatedCandidate[],
) {
  const mine = new Set(current.skillIds);
  return candidates
    .filter((item) => item.id !== current.id)
    .map((item) => {
      const shared = item.skillIds.filter((id) => mine.has(id)).length;
      const sameKind = Boolean(current.subcategory && item.subcategory === current.subcategory);
      return { item, shared, sameKind, score: shared * 2 + (sameKind ? 1 : 0) };
    })
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.item.updatedAt.localeCompare(left.item.updatedAt) ||
        left.item.name.localeCompare(right.item.name),
    )
    .slice(0, 5)
    .map(({ item, shared, sameKind }) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      note: shared > 0 ? `${shared} shared ${shared === 1 ? "tool" : "tools"}` : "Same subcategory",
      sameKind,
    }));
}
