"use client";

import { useTranslations } from "next-intl";
import type { CalendarEpisode } from "@/lib/db/queries";
import { EpisodeEntry } from "./episode-entry";

interface Props {
  episodes: CalendarEpisode[];
}

export function UpcomingSection({ episodes }: Props) {
  const t = useTranslations("pages.calendar");

  if (episodes.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium mb-3">{t("upcoming")}</h2>
      <div className="space-y-2">
        {episodes.map((ep) => (
          <div key={ep.episodeId}>
            <p className="text-xs text-muted mb-1">
              {new Date(ep.airDate + "T00:00:00").toLocaleDateString("ca", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
            <EpisodeEntry episode={ep} />
          </div>
        ))}
      </div>
    </section>
  );
}
