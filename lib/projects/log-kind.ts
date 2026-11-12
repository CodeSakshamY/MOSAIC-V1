export const buildLogKinds = ["update", "milestone", "problem", "experiment"] as const;

export type BuildLogKind = (typeof buildLogKinds)[number];

const labels: Record<BuildLogKind, string> = {
  update: "Update",
  milestone: "Milestone",
  problem: "Problem",
  experiment: "Experiment",
};

export function isBuildLogKind(value: string): value is BuildLogKind {
  return (buildLogKinds as readonly string[]).includes(value);
}

export function buildLogKindLabel(kind: string) {
  return isBuildLogKind(kind) ? labels[kind] : "Update";
}
