export const lookingForOptions = [
  { value: "teammates", label: "Find teammates" },
  { value: "projects", label: "Discover projects" },
  { value: "competitions", label: "Find competitions" },
  { value: "feedback", label: "Get feedback" },
  { value: "contribute", label: "Contribute" },
  { value: "learn", label: "Learn" },
  { value: "show_work", label: "Show work" },
  { value: "mentors", label: "Find mentors" },
] as const;

export type LookingFor = (typeof lookingForOptions)[number]["value"];

const allowed = new Set<string>(lookingForOptions.map((option) => option.value));

export function parseLookingFor(values: string[]) {
  const unique = [...new Set(values)];
  if (unique.length === 0) {
    return { ok: false as const, error: "Choose at least one reason you are here." };
  }
  if (unique.some((value) => !allowed.has(value))) {
    return { ok: false as const, error: "One of those choices is not available." };
  }
  return { ok: true as const, values: unique as LookingFor[] };
}
