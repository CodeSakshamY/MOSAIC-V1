import { ageGroups, type AgeGroup } from "@/lib/profile/age-groups";
import { isProjectCategory, type ProjectCategory } from "@/lib/projects/slug";

export type DiscoverFilters = {
  q: string;
  age: AgeGroup | null;
  place: string;
  skill: string;
  type: ProjectCategory | null;
};

const skillPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function readDiscoverFilters(input: {
  q?: string;
  age?: string;
  place?: string;
  skill?: string;
  type?: string;
}): DiscoverFilters {
  const q = (input.q ?? "").trim().replace(/[%_\\]/g, "").replace(/\s+/g, " ").slice(0, 80);
  const age = ageGroups.find((group) => group.value === input.age)?.value ?? null;
  const place = (input.place ?? "")
    .trim()
    .replace(/[%_*(),.]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  const skill = input.skill && skillPattern.test(input.skill) ? input.skill : "";
  const type = input.type && isProjectCategory(input.type) ? input.type : null;
  return { q, age, place, skill, type };
}

export function peopleFilterActive(filters: DiscoverFilters) {
  return Boolean(filters.age || filters.place || filters.skill);
}
