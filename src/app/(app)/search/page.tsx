"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback } from "react";
import type { ShowSearchResult } from "@/lib/tmdb/dto";
import { useToast } from "@/components/toast";

type TrackingState = "idle" | "loading" | "tracked" | "error";

function SearchResultCard({
  show,
  onTrack,
  trackingState,
}: {
  show: ShowSearchResult;
  onTrack: (tmdbId: number) => void;
  trackingState: TrackingState;
}) {
  const t = useTranslations("pages.search");

  return (
    <div className="group bg-surface rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors">
      <div className="aspect-[2/3] relative bg-surface-hover">
        {show.posterUrl ? (
          <img
            src={show.posterUrl}
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
        {show.firstAirDate && (
          <p className="text-xs text-muted">{show.firstAirDate.slice(0, 4)}</p>
        )}
        <button
          onClick={() => onTrack(show.id)}
          disabled={trackingState === "loading" || trackingState === "tracked"}
          className="mt-2 w-full text-xs font-medium px-2 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {trackingState === "tracked"
            ? `✓ ${t("tracked")}`
            : trackingState === "loading"
              ? t("tracking")
              : t("track")}
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const t = useTranslations("pages.search");
  const tToast = useTranslations("toast");
  const showToast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShowSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [trackingStates, setTrackingStates] = useState<
    Record<number, TrackingState>
  >({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setTotalResults(0);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const res = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(q.trim())}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.results);
      setTotalResults(data.totalResults);
      setSearched(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  }

  async function handleTrack(tmdbId: number) {
    setTrackingStates((prev) => ({ ...prev, [tmdbId]: "loading" }));

    try {
      const res = await fetch("/api/shows/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, state: "WATCHING" }),
      });

      if (res.ok || res.status === 409) {
        setTrackingStates((prev) => ({ ...prev, [tmdbId]: "tracked" }));
        showToast(tToast("showTracked"));
      } else {
        setTrackingStates((prev) => ({ ...prev, [tmdbId]: "error" }));
      }
    } catch {
      setTrackingStates((prev) => ({ ...prev, [tmdbId]: "error" }));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>

      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("placeholder")}
        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors mb-6"
      />

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-red-400 text-center py-8">{t("error")}</p>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <p className="text-muted text-center py-8">
          {t("noResults", { query })}
        </p>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p className="text-sm text-muted mb-4">
            {t("resultCount", { count: totalResults })}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((show) => (
              <SearchResultCard
                key={show.id}
                show={show}
                onTrack={handleTrack}
                trackingState={trackingStates[show.id] ?? "idle"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
