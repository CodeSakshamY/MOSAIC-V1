export const collaborationPreferences = [
  { value: "remote", label: "Remote" },
  { value: "local", label: "In the same city" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export type CollaborationPreference = (typeof collaborationPreferences)[number]["value"];

export function collaborationLabel(value: string | null) {
  return collaborationPreferences.find((item) => item.value === value)?.label ?? null;
}

export function isCollaborationPreference(value: string): value is CollaborationPreference {
  return collaborationPreferences.some((item) => item.value === value);
}
