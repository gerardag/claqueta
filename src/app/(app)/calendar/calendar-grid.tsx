"use client";

import type { CalendarEpisode } from "@/lib/db/queries";
import { EpisodeEntry } from "./episode-entry";

interface Props {
  episodes: CalendarEpisode[];
  year: number;
  month: number;
}

const DAY_NAMES = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

export function CalendarGrid({ episodes, year, month }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const byDay = new Map<number, CalendarEpisode[]>();
  for (const ep of episodes) {
    const day = parseInt(ep.airDate.slice(8, 10), 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(ep);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="bg-surface p-2 text-center text-xs font-medium text-muted uppercase"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const dateStr = day
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null;
          const isToday = dateStr === today;
          const dayEpisodes = day ? byDay.get(day) ?? [] : [];

          return (
            <div
              key={i}
              className={`bg-surface min-h-24 p-1.5 ${!day ? "bg-surface/50" : ""} ${isToday ? "ring-1 ring-inset ring-accent" : ""}`}
            >
              {day && (
                <>
                  <span
                    className={`text-xs font-medium ${isToday ? "text-accent" : "text-muted"} ${dayEpisodes.length > 0 ? "font-bold text-foreground" : ""}`}
                  >
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEpisodes.map((ep) => (
                      <EpisodeEntry key={ep.episodeId} episode={ep} compact />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
