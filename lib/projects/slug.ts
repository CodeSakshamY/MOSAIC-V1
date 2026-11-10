export const projectCategories = [
  "Software",
  "Hardware",
  "CAD",
  "PCB",
  "Firmware",
  "Mechanical",
  "Research",
  "Design",
] as const;

export type ProjectCategory = (typeof projectCategories)[number];

export const projectTypeNotes: Record<ProjectCategory, string> = {
  Software: "Applications, libraries, and tools.",
  Hardware: "Physical machines, enclosures, and assemblies.",
  CAD: "Mechanical models and drawings.",
  PCB: "Circuit boards and electronics layouts.",
  Firmware: "Software that runs on a device.",
  Mechanical: "Mechanisms, structures, and motion.",
  Research: "Experiments, measurements, and notes.",
  Design: "Interfaces, graphics, and form.",
};

const statusLabels: Record<string, string> = {
  idea: "Idea",
  planning: "Planning",
  prototype: "Prototype",
  building: "Building",
  testing: "Testing",
  working: "Working",
  shipped: "Shipped",
  abandoned: "Abandoned",
};

export function projectSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function isProjectSlug(slug: string) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
}

export function isProjectCategory(value: string): value is ProjectCategory {
  return (projectCategories as readonly string[]).includes(value);
}

export function projectStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}
