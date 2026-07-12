"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { CompletedShowWithPending } from "@/lib/db/queries";
import { changeShowStateAction } from "../series/[id]/actions";
import { TvIcon } from "@/components/icons";

export function RegularitzaList({
  shows,
}: {
  shows: CompletedShowWithPending[];
}) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = shows.filter((s) => !dismissed.has(s.tmdbId));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((show) => (
        <RegularitzaCard
          key={show.tmdbId}
          show={show}
          onDismiss={() =>
            setDismissed((prev) => new Set(prev).add(show.tmdbId))
          }
        />
      ))}
    </div>
  );
}

function RegularitzaCard({
  show,
  onDismiss,
}: {
  show: CompletedShowWithPending;
  onDismiss: () => void;
}) {
  const t = useTranslations("pages.regularitza");
  const [isPending, startTransition] = useTransition();
  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w92${show.posterPath}`
    : null;
  const pending = show.totalAired - show.watched;

  function handleFollow() {
    startTransition(async () => {
      await changeShowStateAction(show.tmdbId, "FOLLOWING");
      onDismiss();
    });
  }

  return (
    <div className="flex items-center gap-3 bg-surface border border-border p-3" style={{ borderRadius: "var(--radius-md)" }}>
      <Link href={`/series/${show.tmdbId}`} className="shrink-0">
        <div className="w-12 aspect-[2/3] bg-surface-hover overflow-hidden" style={{ borderRadius: "var(--radius-sm)" }}>
          {posterUrl ? (
            <img src={posterUrl} alt={show.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <TvIcon className="size-5" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/series/${show.tmdbId}`} className="font-display font-semibold text-sm truncate block hover:opacity-70 transition-opacity">
          {show.name}
        </Link>
        <p className="text-xs text-muted mt-0.5">{t("pendingCount", { count: pending })}</p>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleFollow}
          disabled={isPending}
          className="text-xs px-3 py-1.5 bg-accent text-accent-fg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          {t("actions.follow")}
        </button>
        <button
          onClick={onDismiss}
          disabled={isPending}
          className="text-xs px-3 py-1.5 bg-surface-hover text-muted hover:text-foreground transition-colors disabled:opacity-50"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          {t("actions.keepCompleted")}
        </button>
      </div>
    </div>
  );
}
