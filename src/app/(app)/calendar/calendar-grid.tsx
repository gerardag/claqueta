"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import type { CalendarEpisode } from "@/lib/db/queries";
import { EpisodeEntry } from "./episode-entry";

interface Props {
  episodes: CalendarEpisode[];
  year: number;
  month: number;
}

function getDayNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, i + 1); // 2024-01-01 is Monday
    return fmt.format(d);
  });
}

export function CalendarGrid({ episodes, year, month }: Props) {
  const locale = useLocale();
  const dayNames = useMemo(() => getDayNames(locale), [locale]);
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
        {dayNames.map((d) => (
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
              className={`bg-surface min-h-24 p-1.5 ${!day ? "bg-surface/50" : ""} ${isToday ? "ring-1 ring-inset ring-foreground" : ""}`}
            >
              {day && (
                <>
                  <span
                    className={`text-xs font-medium ${isToday ? "text-foreground font-bold" : "text-muted"} ${dayEpisodes.length > 0 ? "font-bold text-foreground" : ""}`}
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
