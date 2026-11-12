export const opportunityCategories = [
  { value: "hackathon", label: "Hackathon" },
  { value: "robotics_competition", label: "Robotics competition" },
  { value: "startup_competition", label: "Startup competition" },
  { value: "science_fair", label: "Science fair" },
  { value: "olympiad", label: "Olympiad" },
  { value: "internship", label: "Internship" },
  { value: "research_program", label: "Research programme" },
  { value: "fellowship", label: "Fellowship" },
  { value: "scholarship", label: "Scholarship" },
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "startup_program", label: "Startup programme" },
  { value: "incubator", label: "Incubator" },
  { value: "open_source", label: "Open source" },
  { value: "volunteering", label: "Volunteering" },
  { value: "mentorship", label: "Mentorship" },
  { value: "grant", label: "Grant" },
  { value: "innovation_challenge", label: "Innovation challenge" },
] as const;

export type OpportunityCategory = (typeof opportunityCategories)[number]["value"];

export function isOpportunityCategory(value: string): value is OpportunityCategory {
  return opportunityCategories.some((item) => item.value === value);
}

export function opportunityCategoryLabel(value: string) {
  return opportunityCategories.find((item) => item.value === value)?.label ?? value;
}
