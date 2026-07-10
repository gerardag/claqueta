"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ShowWithProgress } from "@/lib/db/queries";
import { markNextEpisodeAction } from "./actions";
import { useToast } from "@/components/toast";
import { TvIcon } from "@/components/icons";

export function WatchingCard({ show }: { show: ShowWithProgress }) {
  const t = useTranslations("pages.series");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const showToast = useToast();
  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w185${show.posterPath}`
    : null;

  const ep = show.nextEpisode;
  const isNew = ep?.airDate ? isRecent(ep.airDate) : false;

  return (
    <div
      className="group flex items-stretch bg-surface border border-border hover:border-foreground/50 transition-colors overflow-hidden"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      <Link
        href={`/series/${show.tmdbId}`}
        className="w-20 sm:w-24 flex-shrink-0 overflow-hidden"
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={show.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-surface-hover flex items-center justify-center text-muted">
            <TvIcon className="size-6" />
          </div>
        )}
      </Link>

      <div className="flex-1 flex items-center justify-between gap-3 px-3 py-2.5 min-w-0">
        <div className="min-w-0">
          <Link
            href={`/series/${show.tmdbId}`}
            className="font-display font-semibold text-sm hover:text-foreground/70 transition-colors truncate block"
          >
            {show.name}
          </Link>

          {ep && (
            <>
              <p className="text-sm mt-0.5">
                <span className="font-semibold">
                  S{String(ep.seasonNumber).padStart(2, "0")} | E
                  {String(ep.episodeNumber).padStart(2, "0")}
                </span>
                {ep.pendingAfter > 0 && (
                  <span className="text-muted ml-1">+{ep.pendingAfter}</span>
                )}
              </p>
              {ep.name && (
                <p className="text-xs text-muted mt-0.5 truncate">{ep.name}</p>
              )}
              {isNew && (
                <span className="inline-block text-[10px] font-bold bg-accent text-accent-fg px-1.5 py-0.5 rounded mt-1 uppercase">
                  {t("newBadge")}
                </span>
              )}
            </>
          )}

          {!ep && (
            <p className="text-xs text-muted mt-0.5">
              ✓ {t("upToDate")}
              {show.nextAirDate && (
                <span className="text-foreground ml-1">
                  · {t("nextEpisode", { date: formatAirDate(show.nextAirDate, locale) })}
                </span>
              )}
            </p>
          )}
        </div>

        {ep && (
          <button
            onClick={async () => {
              await markNextEpisodeAction(
                show.showId,
                show.tmdbId,
                ep.seasonNumber,
                ep.episodeNumber,
              );
              showToast(tToast("episodeWatched"));
            }}
            className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-border hover:border-foreground hover:text-foreground text-muted transition-colors flex items-center justify-center focus-visible:outline-accent"
            aria-label={t("actions.markWatched")}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function isRecent(airDate: string): boolean {
  const diff =
    Date.now() - new Date(airDate + "T00:00:00").getTime();
  return diff < 7 * 24 * 60 * 60 * 1000 && diff >= 0;
}

function formatAirDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(locale, { day: "numeric", month: "long" });
}
