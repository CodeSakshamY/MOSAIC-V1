export const MINIMUM_AGE = 13;

export const ageGroups = [
  { value: "13_15", label: "13–15" },
  { value: "16_17", label: "16–17" },
  { value: "18_24", label: "18–24" },
  { value: "25_34", label: "25–34" },
  { value: "35_plus", label: "35+" },
] as const;

export type AgeGroup = (typeof ageGroups)[number]["value"];
