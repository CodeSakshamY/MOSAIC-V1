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

export const projectStatuses = [
  { value: "idea", label: "Idea" },
  { value: "researching", label: "Researching" },
  { value: "in_development", label: "In development" },
  { value: "prototype", label: "Prototype" },
  { value: "testing", label: "Testing" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
] as const;

export type ProjectStatus = (typeof projectStatuses)[number]["value"];

export function isProjectStatus(value: string): value is ProjectStatus {
  return projectStatuses.some((item) => item.value === value);
}

export function projectStatusLabel(status: string) {
  return projectStatuses.find((item) => item.value === status)?.label ?? status;
}

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

export const projectSubcategories: Record<ProjectCategory, readonly string[]> = {
  Software: ["Web", "Mobile", "Desktop", "Library"],
  Hardware: ["Enclosure", "Sensor", "Power", "Robot"],
  CAD: ["Part", "Assembly", "Drawing"],
  PCB: ["Schematic", "Layout", "Module"],
  Firmware: ["Microcontroller", "Driver", "Bootloader"],
  Mechanical: ["Mechanism", "Structure", "Motion"],
  Research: ["Experiment", "Measurement", "Survey"],
  Design: ["Interface", "Graphic", "Form"],
};

export function isProjectCategory(value: string): value is ProjectCategory {
  return (projectCategories as readonly string[]).includes(value);
}

export function isProjectSubcategory(category: string, subcategory: string) {
  return isProjectCategory(category) && projectSubcategories[category].includes(subcategory);
}
