"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

const THEMES = [
  { id: "default", type: "dark" },
  { id: "nit-violeta", type: "dark" },
  { id: "bosc-profund", type: "dark" },
  { id: "brasa", type: "dark" },
  { id: "mar-de-nit", type: "dark" },
  { id: "capvespre", type: "dark" },
  { id: "tarda-estiu", type: "light" },
  { id: "jardi-japones", type: "light" },
  { id: "pergami", type: "light" },
  { id: "mati-tardor", type: "light" },
  { id: "lavanda", type: "light" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const THEME_COLORS: Record<ThemeId, { bg: string; surface: string; accent: string; fg: string }> = {
  default:        { bg: "#0a0a0a", surface: "#141414", accent: "#3b82f6", fg: "#ededed" },
  "nit-violeta":  { bg: "#0e0d18", surface: "#16141f", accent: "#bdf226", fg: "#e8ecd0" },
  "bosc-profund": { bg: "#0a1210", surface: "#121e1a", accent: "#6bffb3", fg: "#bfffe6" },
  brasa:          { bg: "#0e0906", surface: "#1a120c", accent: "#e5a85e", fg: "#f0dcc8" },
  "mar-de-nit":   { bg: "#0a0e18", surface: "#111620", accent: "#96bfe6", fg: "#b5d1cc" },
  capvespre:      { bg: "#0e0c14", surface: "#15131c", accent: "#d94d99", fg: "#e0dcc0" },
  "tarda-estiu":  { bg: "#faf6e8", surface: "#f5f0de", accent: "#e85560", fg: "#0f261f" },
  "jardi-japones":{ bg: "#f2f8f4", surface: "#e8f2ec", accent: "#9b5348", fg: "#1a1a1a" },
  pergami:        { bg: "#f8f6ee", surface: "#f0ede2", accent: "#c88a5a", fg: "#1b3644" },
  "mati-tardor":  { bg: "#f6f4e6", surface: "#edeadb", accent: "#718600", fg: "#172713" },
  lavanda:        { bg: "#f7f8f4", surface: "#eef0ea", accent: "#a10045", fg: "#2a3230" },
};

function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "default";
  return (localStorage.getItem("theme") as ThemeId) ?? "default";
}

function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  if (id === "default") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", id);
  }
  localStorage.setItem("theme", id);
  document.cookie = `theme=${id};path=/;max-age=31536000;SameSite=Lax`;
}

export function ThemeSelector() {
  const t = useTranslations("pages.settings.theme");
  const [current, setCurrent] = useState<ThemeId>("default");

  useEffect(() => {
    // Reads a browser-only API (localStorage), so it can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(getStoredTheme());
  }, []);

  function select(id: ThemeId) {
    setCurrent(id);
    applyTheme(id);
  }

  const darkThemes = THEMES.filter((th) => th.type === "dark");
  const lightThemes = THEMES.filter((th) => th.type === "light");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted mb-2">{t("dark")}</p>
        <div className="grid grid-cols-3 gap-2">
          {darkThemes.map((th) => (
            <ThemeSwatch
              key={th.id}
              id={th.id}
              label={t(th.id)}
              colors={THEME_COLORS[th.id]}
              selected={current === th.id}
              onSelect={select}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted mb-2">{t("light")}</p>
        <div className="grid grid-cols-3 gap-2">
          {lightThemes.map((th) => (
            <ThemeSwatch
              key={th.id}
              id={th.id}
              label={t(th.id)}
              colors={THEME_COLORS[th.id]}
              selected={current === th.id}
              onSelect={select}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeSwatch({
  id,
  label,
  colors,
  selected,
  onSelect,
}: {
  id: ThemeId;
  label: string;
  colors: { bg: string; surface: string; accent: string; fg: string };
  selected: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`rounded-lg border-2 p-2 transition-colors text-left ${
        selected ? "border-accent" : "border-border hover:border-accent/50"
      }`}
    >
      <div
        className="rounded-md h-10 mb-1.5 flex items-end p-1.5 gap-1"
        style={{ backgroundColor: colors.bg }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
        <div
          className="w-6 h-2 rounded-sm"
          style={{ backgroundColor: colors.surface }}
        />
        <div
          className="flex-1 h-1.5 rounded-sm"
          style={{ backgroundColor: colors.fg, opacity: 0.3 }}
        />
      </div>
      <p className="text-[10px] leading-tight truncate">{label}</p>
    </button>
  );
}
