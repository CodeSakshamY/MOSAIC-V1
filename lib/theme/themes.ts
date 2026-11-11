export const themes = [
  { id: "dark", label: "Dark", mode: "dark", swatch: ["#102A24", "#141817", "#E8E1D3"] },
  { id: "light", label: "Light", mode: "light", swatch: ["#E7EFE9", "#F4F1EA", "#102A24"] },
  { id: "blue", label: "Blue", mode: "dark", swatch: ["#0B1220", "#0E1624", "#7EB0E0"] },
  { id: "blue-white", label: "Blue white", mode: "light", swatch: ["#E7F0F8", "#FFFFFF", "#123A66"] },
  { id: "blue-green", label: "Blue green", mode: "dark", swatch: ["#0A1718", "#0D1C1E", "#6EC9C0"] },
  { id: "white", label: "White", mode: "light", swatch: ["#F3F4F6", "#FFFFFF", "#1D4E89"] },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function themeFromId(value: string | undefined) {
  return themes.find((theme) => theme.id === value) ?? themes[0];
}
