"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ShowSearchResult } from "@/lib/tmdb/dto";
import { useToast } from "@/components/toast";
import { TvIcon } from "@/components/icons";

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
    <div
      className="group bg-surface overflow-hidden border border-border hover:border-foreground/50 transition-colors"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      <Link href={`/series/${show.id}`}>
        <div className="aspect-[2/3] relative bg-surface-hover overflow-hidden">
          {show.posterUrl ? (
            <img
              src={show.posterUrl}
              alt={show.name}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <TvIcon className="size-8" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-2">
        <Link href={`/series/${show.id}`}>
          <p className="font-display font-semibold text-sm truncate hover:text-foreground/70 transition-colors">
            {show.name}
          </p>
        </Link>
        {show.firstAirDate && (
          <p className="text-xs text-muted">{show.firstAirDate.slice(0, 4)}</p>
        )}
        <button
          onClick={() => onTrack(show.id)}
          disabled={trackingState === "loading" || trackingState === "tracked"}
          className="mt-2 w-full text-xs font-medium px-2 py-1.5 rounded bg-surface-hover text-foreground hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus-visible:outline-accent"
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

function SearchPageContent() {
  const t = useTranslations("pages.search");
  const tToast = useTranslations("toast");
  const showToast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<ShowSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [trackingStates, setTrackingStates] = useState<
    Record<number, TrackingState>
  >({});
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set());
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

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q) queueMicrotask(() => search(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/shows/tracked-ids")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tmdbIds) setTrackedIds(new Set<number>(data.tmdbIds));
      })
      .catch(() => {});
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    router.replace(
      value.trim() ? `/search?q=${encodeURIComponent(value)}` : "/search",
      { scroll: false },
    );
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
      <h1 className="font-display font-bold text-2xl tracking-tight mb-4">{t("title")}</h1>

      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("placeholder")}
        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors mb-6"
      />

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
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
                trackingState={
                  trackingStates[show.id] ??
                  (trackedIds.has(show.id) ? "tracked" : "idle")
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
