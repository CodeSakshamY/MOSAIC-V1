"use client";

import { useState } from "react";
import { themeFromId, themes, type ThemeId } from "@/lib/theme/themes";

export function ThemePicker({ current }: { current: ThemeId }) {
  const [selected, setSelected] = useState(current);

  function choose(id: ThemeId) {
    const theme = themeFromId(id);
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.style.colorScheme = theme.mode;
    root.classList.toggle("dark", theme.mode === "dark");
    document.cookie = `mosaic-theme=${theme.id}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setSelected(theme.id);
  }

  return (
    <fieldset className="theme-grid">
      <legend>Colour scheme</legend>
      {themes.map((theme) => (
        <label key={theme.id} className="theme-option">
          <input
            type="radio"
            name="colour-scheme"
            value={theme.id}
            checked={selected === theme.id}
            onChange={() => choose(theme.id)}
          />
          <span className="theme-swatch" aria-hidden="true">
            {theme.swatch.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </span>
          <span>{theme.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
