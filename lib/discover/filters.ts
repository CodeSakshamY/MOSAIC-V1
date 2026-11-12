import { lookingForOptions, type LookingFor } from "@/lib/auth/looking-for";
import { ageGroups, type AgeGroup } from "@/lib/profile/age-groups";
import { isCollaborationPreference, type CollaborationPreference } from "@/lib/profile/collaboration";
import { isProjectCategory, type ProjectCategory } from "@/lib/projects/slug";

export type DiscoverFilters = {
  q: string;
  age: AgeGroup | null;
  place: string;
  skill: string;
  discipline: string;
  interest: string;
  experience: ProjectCategory | null;
  availability: CollaborationPreference | "";
  looking: LookingFor | "";
  type: ProjectCategory | null;
};

const skillPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const interestCategories = [
  { value: "technology", label: "Technology" },
  { value: "science", label: "Science" },
  { value: "society", label: "Society" },
  { value: "design", label: "Design" },
  { value: "research", label: "Research" },
] as const;

export function readDiscoverFilters(input: {
  q?: string;
  age?: string;
  place?: string;
  skill?: string;
  discipline?: string;
  interest?: string;
  experience?: string;
  availability?: string;
  looking?: string;
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
  const discipline = interestCategories.find((category) => category.value === input.discipline)?.value ?? "";
  const interest = input.interest && skillPattern.test(input.interest) ? input.interest : "";
  const experience = input.experience && isProjectCategory(input.experience) ? input.experience : null;
  const availability = input.availability && isCollaborationPreference(input.availability) ? input.availability : "";
  const looking = lookingForOptions.find((option) => option.value === input.looking)?.value ?? "";
  const type = input.type && isProjectCategory(input.type) ? input.type : null;
  return { q, age, place, skill, discipline, interest, experience, availability, looking, type };
}

export function peopleFilterActive(filters: DiscoverFilters) {
  return Boolean(
    filters.age || filters.place || filters.skill || filters.discipline || filters.interest || filters.experience || filters.availability || filters.looking,
  );
}
