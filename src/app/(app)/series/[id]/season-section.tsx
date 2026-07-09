"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toggleEpisodeAction, markSeasonWatchedAction } from "./actions";
import { useToast } from "@/components/toast";

interface EpisodeData {
  id: number;
  episodeNumber: number;
  name: string | null;
  airDate: string | null;
  watched: boolean;
  aired: boolean;
}

interface SeasonData {
  seasonNumber: number;
  name: string;
  episodes: EpisodeData[];
  watchedCount: number;
  airedCount: number;
  totalCount: number;
}

interface Props {
  tmdbId: number;
  season: SeasonData;
}

export function SeasonSection({ tmdbId, season }: Props) {
  const t = useTranslations("pages.showDetail");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const allAiredWatched =
    season.airedCount > 0 && season.watchedCount >= season.airedCount;

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors text-left focus-visible:outline-accent"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-sm">{season.name}</span>
          <span className="text-xs text-muted">
            {t("episodes", { count: season.totalCount })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {season.watchedCount}/{season.airedCount}
          </span>
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{
                width: `${season.airedCount > 0 ? (season.watchedCount / season.airedCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {!allAiredWatched && season.airedCount > 0 && (
            <button
              onClick={async () => {
                await markSeasonWatchedAction(tmdbId, season.seasonNumber);
                showToast(tToast("seasonWatched"));
              }}
              className="w-full text-left text-xs text-accent px-4 py-2 hover:bg-surface-hover transition-colors border-b border-border focus-visible:outline-accent"
            >
              {t("markSeasonWatched")}
            </button>
          )}
          <div className="divide-y divide-border" role="list">
            {season.episodes.map((ep) => (
              <div
                key={ep.episodeNumber}
                role="listitem"
                className={`flex items-center gap-3 px-4 py-2.5 ${!ep.aired ? "opacity-40" : ""}`}
              >
                <button
                  role="checkbox"
                  aria-checked={ep.watched}
                  aria-label={`${ep.name || t("episodeFallback", { number: ep.episodeNumber })} — ${ep.watched ? t("markUnwatched") : t("markWatched")}`}
                  onClick={async () => {
                    if (ep.aired) {
                      await toggleEpisodeAction(
                        tmdbId,
                        season.seasonNumber,
                        ep.episodeNumber,
                        ep.watched,
                      );
                      showToast(tToast("episodeWatched"));
                    }
                  }}
                  disabled={!ep.aired}
                  className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                    ep.watched
                      ? "bg-accent border-accent text-white"
                      : "border-border hover:border-accent/50"
                  } ${!ep.aired ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {ep.watched && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-muted w-6 text-right flex-shrink-0">
                  {ep.episodeNumber}
                </span>
                <span className={`text-sm flex-1 truncate ${ep.watched ? "text-muted" : ""}`}>
                  {ep.name || t("episodeFallback", { number: ep.episodeNumber })}
                </span>
                {ep.airDate && (
                  <span className="text-xs text-muted flex-shrink-0">
                    {formatDate(ep.airDate, locale)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
