"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ShowWithProgress } from "@/lib/db/queries";
import { stopShowAction, deleteShowAction } from "./actions";
import { useToast } from "@/components/toast";

export function ShowCard({ show }: { show: ShowWithProgress }) {
  const t = useTranslations("pages.series");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const showToast = useToast();
  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w300${show.posterPath}`
    : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="group relative bg-surface rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors">
      <Link href={`/series/${show.tmdbId}`}>
        <div className="aspect-[2/3] relative bg-surface-hover">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={show.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm">
              🎬
            </div>
          )}
        </div>
      </Link>
      <div className="p-2">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-medium truncate flex-1">{show.name}</p>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-muted hover:text-foreground transition-colors p-0.5 -mr-1 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-accent"
              aria-label={tCommon("menu")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-10 bg-surface border border-border rounded-md shadow-lg min-w-[140px]">
                <button
                  onClick={async () => {
                    await stopShowAction(show.showId);
                    setMenuOpen(false);
                    showToast(tToast("showStopped"));
                  }}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-surface-hover transition-colors text-muted hover:text-foreground focus-visible:outline-accent"
                >
                  {t("actions.stop")}
                </button>
                <button
                  onClick={async () => {
                    await deleteShowAction(show.showId);
                    setMenuOpen(false);
                    showToast(tToast("showDeleted"));
                  }}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-surface-hover transition-colors text-red-400 hover:text-red-300 focus-visible:outline-accent"
                >
                  {t("actions.delete")}
                </button>
              </div>
            )}
          </div>
        </div>
        {show.nextAirDate && (
          <p className="text-xs text-accent mt-1">
            {t("nextEpisode", { date: formatAirDate(show.nextAirDate, locale) })}
          </p>
        )}
      </div>
    </div>
  );
}

function formatAirDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(locale, { day: "numeric", month: "long" });
}
