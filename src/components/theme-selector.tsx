"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon, AutoThemeIcon } from "./icons";

type ThemeId = "dark" | "light" | "auto";

const THEMES = ["dark", "light", "auto"] as const;

function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "auto" ? stored : "dark";
}

function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  if (id === "dark") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", id);
  }
  localStorage.setItem("theme", id);
  document.cookie = `theme=${id};path=/;max-age=31536000;SameSite=Lax`;
}

const ICONS = { dark: MoonIcon, light: SunIcon, auto: AutoThemeIcon };

export function ThemeSelector({
  variant = "surface",
}: {
  variant?: "surface" | "menu";
}) {
  const t = useTranslations("pages.settings.theme");
  const [current, setCurrent] = useState<ThemeId>("dark");

  useEffect(() => {
    // Reads a browser-only API (localStorage), so it can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(getStoredTheme());
  }, []);

  function select(id: ThemeId) {
    setCurrent(id);
    applyTheme(id);
  }

  const isMenu = variant === "menu";

  return (
    <div className="inline-flex gap-1">
      {THEMES.map((id) => {
        const Icon = ICONS[id];
        const active = current === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => select(id)}
            aria-label={t(id)}
            aria-pressed={active}
            className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
              active
                ? isMenu
                  ? "bg-paper/15 text-paper"
                  : "bg-accent text-accent-fg"
                : isMenu
                  ? "text-paper/70 hover:text-paper"
                  : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
