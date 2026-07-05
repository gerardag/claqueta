"use client";

import type { CalendarEpisode } from "@/lib/db/queries";
import { EpisodeEntry } from "./episode-entry";

interface Props {
  episodes: CalendarEpisode[];
}

export function AgendaView({ episodes }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const byDate = new Map<string, CalendarEpisode[]>();
  for (const ep of episodes) {
    if (!byDate.has(ep.airDate)) byDate.set(ep.airDate, []);
    byDate.get(ep.airDate)!.push(ep);
  }

  const dates = [...byDate.keys()].sort();

  if (dates.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden space-y-4">
      {dates.map((date) => {
        const isToday = date === today;
        const formatted = new Date(date + "T00:00:00").toLocaleDateString("ca", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        return (
          <div key={date}>
            <h3
              className={`text-sm font-medium mb-2 capitalize ${isToday ? "text-accent" : "text-muted"}`}
            >
              {formatted}
              {isToday && " — avui"}
            </h3>
            <div className="space-y-2">
              {byDate.get(date)!.map((ep) => (
                <EpisodeEntry key={ep.episodeId} episode={ep} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
