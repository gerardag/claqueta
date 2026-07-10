"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

type ThemeId = "dark" | "light";

function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as ThemeId) ?? "dark";
}

function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  if (id === "light") {
    html.setAttribute("data-theme", "light");
  } else {
    html.removeAttribute("data-theme");
  }
  localStorage.setItem("theme", id);
  document.cookie = `theme=${id};path=/;max-age=31536000;SameSite=Lax`;
}

export function ThemeSelector() {
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

  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1">
      {(["dark", "light"] as const).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => select(id)}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            current === id
              ? "bg-accent text-accent-fg"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t(id)}
        </button>
      ))}
    </div>
  );
}
