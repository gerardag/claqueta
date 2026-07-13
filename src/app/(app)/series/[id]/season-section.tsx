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
  previousSeasonNumbers: number[];
}

export function SeasonSection({ tmdbId, season, previousSeasonNumbers }: Props) {
  const t = useTranslations("pages.showDetail");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const allAiredWatched =
    season.airedCount > 0 && season.watchedCount >= season.airedCount;

  async function markWatched(includePrevious: boolean) {
    setConfirmOpen(false);
    await markSeasonWatchedAction(
      tmdbId,
      includePrevious
        ? [season.seasonNumber, ...previousSeasonNumbers]
        : season.seasonNumber,
    );
    showToast(tToast("seasonWatched"));
  }

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      <div className="w-full flex items-center justify-between p-3 gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity focus-visible:outline-accent"
        >
          <svg
            className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-sm truncate">{season.name}</span>
          <span className="text-xs text-muted flex-shrink-0">
            {t("episodes", { count: season.totalCount })}
          </span>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted">
            {season.watchedCount}/{season.totalCount}
          </span>
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all"
              style={{
                width: `${season.totalCount > 0 ? (season.watchedCount / season.totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          {season.airedCount > 0 && (
            <button
              onClick={() => {
                if (allAiredWatched) return;
                if (previousSeasonNumbers.length > 0) {
                  setConfirmOpen(true);
                } else {
                  markWatched(false);
                }
              }}
              disabled={allAiredWatched}
              aria-label={t("markSeasonWatched")}
              title={t("markSeasonWatched")}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors focus-visible:outline-accent ${
                allAiredWatched
                  ? "bg-accent border-accent text-accent-fg cursor-default"
                  : "border-border text-muted hover:border-foreground/50 hover:text-foreground"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="px-4 py-3 border-t border-border bg-surface-hover flex flex-col gap-2">
          <p className="text-xs text-muted">{t("previousSeasonsPrompt")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => markWatched(false)}
              className="text-xs bg-surface border border-border px-2.5 py-1 rounded-md hover:border-foreground/50 transition-colors focus-visible:outline-accent"
            >
              {t("previousSeasonsOnlyThis")}
            </button>
            <button
              onClick={() => markWatched(true)}
              className="text-xs bg-accent text-accent-fg px-2.5 py-1 rounded-md hover:opacity-90 transition-opacity focus-visible:outline-accent"
            >
              {t("previousSeasonsAlsoPrevious")}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="text-xs text-muted px-2.5 py-1 rounded-md hover:text-foreground transition-colors focus-visible:outline-accent"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-border">
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
                  className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                    ep.watched
                      ? "bg-accent border-accent text-accent-fg"
                      : "border-border hover:border-foreground/50"
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
