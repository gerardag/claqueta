"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { LibraryShow } from "@/lib/db/queries";

const STATE_COLORS: Record<string, string> = {
  WATCHING: "bg-accent/15 text-accent",
  FOLLOWING: "bg-blue-500/15 text-blue-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  STOPPED: "bg-neutral-500/15 text-muted",
};

export function LibraryGrid({ shows }: { shows: LibraryShow[] }) {
  const t = useTranslations("pages.library");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return shows.filter((s) => {
      if (stateFilter && s.state !== stateFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [shows, query, stateFilter]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of shows) {
      counts[s.state] = (counts[s.state] ?? 0) + 1;
    }
    return counts;
  }, [shows]);

  const states = ["WATCHING", "FOLLOWING", "COMPLETED", "STOPPED"] as const;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStateFilter(null)}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
            stateFilter === null
              ? "bg-accent text-white"
              : "bg-surface-hover text-muted hover:text-foreground"
          }`}
        >
          {t("total", { count: shows.length })}
        </button>
        {states.map(
          (state) =>
            stateCounts[state] && (
              <button
                key={state}
                onClick={() =>
                  setStateFilter(stateFilter === state ? null : state)
                }
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  stateFilter === state
                    ? "bg-accent text-white"
                    : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                {t(`states.${state}`)} ({stateCounts[state]})
              </button>
            ),
        )}
      </div>

      {filtered.length === 0 && query ? (
        <p className="text-muted text-center py-12">
          {t("noResults", { query })}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((show) => (
            <LibraryCard key={show.userShowId} show={show} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({ show }: { show: LibraryShow }) {
  const t = useTranslations("pages.library");
  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w300${show.posterPath}`
    : null;

  const pct =
    show.totalAired > 0
      ? Math.round((show.watched / show.totalAired) * 100)
      : 0;

  return (
    <Link
      href={`/series/${show.tmdbId}`}
      className="bg-surface rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors"
    >
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
      <div className="p-2">
        <p className="text-sm font-medium truncate">{show.name}</p>
        <div className="mt-1">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-0.5">
            {show.watched}/{show.totalAired}
          </p>
        </div>
        <span
          className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${STATE_COLORS[show.state]}`}
        >
          {t(`states.${show.state}`)}
        </span>
      </div>
    </Link>
  );
}
