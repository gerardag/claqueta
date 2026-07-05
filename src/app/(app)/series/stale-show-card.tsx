"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ShowWithProgress } from "@/lib/db/queries";
import { ProgressBar } from "./progress-bar";
import { stopShowAction, deleteShowAction } from "./actions";

export function StaleShowCard({ show }: { show: ShowWithProgress }) {
  const t = useTranslations("pages.series");
  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w300${show.posterPath}`
    : null;

  const daysSince = Math.floor(
    (Date.now() - show.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const relativeTime = formatRelativeTime(daysSince);

  return (
    <div className="bg-surface rounded-lg overflow-hidden border border-border">
      <Link href={`/series/${show.tmdbId}`}>
        <div className="aspect-[2/3] relative bg-surface-hover">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={show.name}
              className="w-full h-full object-cover opacity-70"
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
        <p className="text-sm font-medium truncate">{show.name}</p>
        <ProgressBar watched={show.watched} total={show.totalAired} />
        <p className="text-xs text-muted mt-1">
          {t("lastWatched", { time: relativeTime })}
        </p>
        <div className="flex gap-1 mt-2">
          <Link
            href={`/series/${show.tmdbId}`}
            className="flex-1 text-center text-xs bg-accent/10 text-accent rounded px-1 py-1 hover:bg-accent/20 transition-colors"
          >
            {t("actions.continue")}
          </Link>
          <button
            onClick={() => stopShowAction(show.showId)}
            className="flex-1 text-xs bg-surface-hover text-muted rounded px-1 py-1 hover:text-foreground transition-colors"
          >
            {t("actions.stop")}
          </button>
          <button
            onClick={() => deleteShowAction(show.showId)}
            className="text-xs text-muted rounded px-1 py-1 hover:text-red-400 transition-colors"
          >
            {t("actions.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(days: number): string {
  const rtf = new Intl.RelativeTimeFormat("ca", { numeric: "auto" });
  if (days < 30) {
    return rtf.format(-days, "day");
  }
  const months = Math.floor(days / 30);
  return rtf.format(-months, "month");
}
