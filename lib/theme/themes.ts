export const themes = [
  { id: "dark", label: "Dark", mode: "dark", swatch: ["#102A24", "#1B211F", "#E8E1D3"] },
  { id: "light", label: "Light", mode: "light", swatch: ["#14352C", "#F3F6F4", "#E8E1D3"] },
  { id: "blue", label: "Blue", mode: "dark", swatch: ["#0C1B33", "#18263D", "#7EB0E0"] },
  { id: "blue-white", label: "Blue white", mode: "light", swatch: ["#102A4A", "#F4F7FB", "#D6E4F5"] },
  { id: "blue-green", label: "Blue green", mode: "dark", swatch: ["#082022", "#17383B", "#6EC9C0"] },
  { id: "white", label: "White", mode: "light", swatch: ["#1A2332", "#F7F6F3", "#E7EEF6"] },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function themeFromId(value: string | undefined) {
  return themes.find((theme) => theme.id === value) ?? themes[0];
}
