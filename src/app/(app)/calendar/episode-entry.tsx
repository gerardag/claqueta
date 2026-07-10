"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { CalendarEpisode } from "@/lib/db/queries";
import { markWatchedAction } from "./actions";
import { useToast } from "@/components/toast";

interface Props {
  episode: CalendarEpisode;
  compact?: boolean;
}

export function EpisodeEntry({ episode, compact }: Props) {
  const t = useTranslations("pages.calendar");
  const tToast = useTranslations("toast");
  const [pending, startTransition] = useTransition();
  const showToast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const aired = episode.airDate <= today;
  const canMark = aired && !episode.watched;

  const seasonEp = `S${String(episode.seasonNumber).padStart(2, "0")}E${String(episode.episodeNumber).padStart(2, "0")}`;
  const posterUrl = episode.posterPath
    ? `https://image.tmdb.org/t/p/w92${episode.posterPath}`
    : null;

  function handleMark() {
    startTransition(async () => {
      await markWatchedAction(episode.episodeId);
      showToast(tToast("episodeWatched"));
    });
  }

  if (compact) {
    return (
      <div
        className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${episode.watched ? "text-muted line-through" : canMark ? "bg-foreground/10 text-foreground" : "text-muted"}`}
      >
        <span className="font-medium">{episode.showName}</span>{" "}
        <span className="text-muted">{seasonEp}</span>
        {canMark && (
          <button
            disabled={pending}
            onClick={handleMark}
            className="ml-1 text-foreground hover:opacity-80 focus-visible:outline-accent"
            title={t("markWatched")}
          >
            ✓
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg bg-surface border border-border ${episode.watched ? "opacity-60" : ""}`}
    >
      {posterUrl && (
        <img
          src={posterUrl}
          alt={episode.showName}
          className="w-10 h-14 rounded object-cover flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{episode.showName}</p>
        <p className="text-xs text-muted">
          {seasonEp}
          {episode.name && ` · ${episode.name}`}
        </p>
      </div>
      {canMark && (
        <button
          disabled={pending}
          onClick={handleMark}
          className="px-2 py-1 text-xs rounded bg-accent text-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0 focus-visible:outline-accent"
        >
          {pending ? "…" : `✓ ${t("watched")}`}
        </button>
      )}
      {episode.watched && (
        <span className="text-xs text-muted flex-shrink-0">✓</span>
      )}
    </div>
  );
}
