import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ShowWithProgress } from "@/lib/db/queries";
import { ProgressBar } from "./progress-bar";

export function ShowCard({ show }: { show: ShowWithProgress }) {
  const t = useTranslations("pages.series");
  const pending = show.totalAired - show.watched;
  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w300${show.posterPath}`
    : null;

  return (
    <Link
      href={`/series/${show.tmdbId}`}
      className="group bg-surface rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors"
    >
      <div className="aspect-[2/3] relative bg-surface-hover">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={show.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            🎬
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{show.name}</p>
        <ProgressBar watched={show.watched} total={show.totalAired} />
        {pending > 0 && (
          <p className="text-xs text-muted mt-1">
            {t("pending", { count: pending })}
          </p>
        )}
        {show.nextAirDate && (
          <p className="text-xs text-accent mt-1">
            {t("nextEpisode", { date: formatAirDate(show.nextAirDate) })}
          </p>
        )}
      </div>
    </Link>
  );
}

function formatAirDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("ca", { day: "numeric", month: "long" });
}
