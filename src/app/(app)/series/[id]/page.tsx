import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  getShowByTmdbId,
  getUserShowByTmdbId,
  getEpisodesByShow,
  getWatchedEpisodeIds,
} from "@/lib/db/queries";
import { fetchTmdb } from "@/lib/tmdb/client";
import type { TmdbShowDetailRaw } from "@/lib/tmdb/dto";
import { normalizeShowDetail } from "@/lib/tmdb/dto";
import { upsertShowFromTmdb } from "@/lib/tmdb/sync";
import { fetchScare } from "@/lib/scare/client";
import { SeasonSection } from "./season-section";
import { ShowActions } from "./show-actions";
import { BackButton } from "./back-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShowDetailPage({ params }: Props) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound();

  const t = await getTranslations("pages.showDetail");
  const user = await requireUser();
  const userId = Number(user.id);

  let detail;
  try {
    const raw = await fetchTmdb<TmdbShowDetailRaw>(
      `/tv/${tmdbId}`,
      {},
      "show",
    );
    detail = normalizeShowDetail(raw);
  } catch {
    notFound();
  }

  const scareResult = await fetchScare(tmdbId, "tv");

  await upsertShowFromTmdb(tmdbId);
  const localShow = getShowByTmdbId(db, tmdbId);
  const userShow = localShow
    ? getUserShowByTmdbId(db, userId, tmdbId)
    : undefined;
  const episodes = localShow ? getEpisodesByShow(db, localShow.id) : [];
  const watchedIds = localShow
    ? getWatchedEpisodeIds(db, userId, localShow.id)
    : new Set<number>();

  const seasonNumbers = detail.seasons
    .filter((s) => s.seasonNumber > 0)
    .map((s) => s.seasonNumber);

  const today = new Date().toISOString().slice(0, 10);
  const seasonData = seasonNumbers.map((sn) => {
    const seasonEps = episodes.filter((ep) => ep.seasonNumber === sn);
    const airedEps = seasonEps.filter((ep) => ep.airDate && ep.airDate <= today);
    const watchedCount = seasonEps.filter((ep) => watchedIds.has(ep.id)).length;
    return {
      seasonNumber: sn,
      name: detail.seasons.find((s) => s.seasonNumber === sn)?.name ?? `T${sn}`,
      episodes: seasonEps.map((ep) => ({
        id: ep.id,
        episodeNumber: ep.episodeNumber,
        name: ep.name,
        airDate: ep.airDate,
        watched: watchedIds.has(ep.id),
        aired: !!ep.airDate && ep.airDate <= today,
      })),
      watchedCount,
      airedCount: airedEps.length,
      totalCount: seasonEps.length,
    };
  });

  const totalAired = seasonData.reduce((sum, s) => sum + s.airedCount, 0);
  const totalWatched = seasonData.reduce((sum, s) => sum + s.watchedCount, 0);
  const allEpisodesWatched = totalAired > 0 && totalWatched >= totalAired;

  const statusMap: Record<string, string> = {
    "Returning Series": t("statuses.Returning Series"),
    Ended: t("statuses.Ended"),
    Canceled: t("statuses.Canceled"),
    "In Production": t("statuses.In Production"),
  };

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton />

      {detail.backdropUrl && (
        <img
          src={detail.backdropUrl}
          alt=""
          className="w-full aspect-video object-cover rounded-lg mb-6 sm:hidden"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {detail.posterUrl && (
          <img
            src={detail.posterUrl}
            alt={detail.name}
            className="w-48 rounded-lg self-start hidden sm:block"
          />
        )}
        <div className="flex-1">
          {scareResult && (
            <span
              className={`inline-block text-sm px-3 py-1 rounded-full mb-2 ${
                scareResult.scared === "si"
                  ? "bg-red-500/15 text-red-500"
                  : scareResult.scared === "mig"
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-green-500/15 text-green-500"
              }`}
            >
              {scareResult.label}
            </span>
          )}
          <h1 className="font-display font-bold text-2xl tracking-tight mb-2">{detail.name}</h1>
          {detail.originalName !== detail.name && (
            <p className="text-sm text-muted mb-2">{detail.originalName}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-muted mb-4">
            <span>{t("status")}: {statusMap[detail.status] ?? detail.status}</span>
            {detail.firstAirDate && (
              <span>{detail.firstAirDate.slice(0, 4)}</span>
            )}
            <span>
              {t("seasons", { count: detail.numberOfSeasons })}
            </span>
          </div>
          {detail.overview && (
            <p className="text-sm text-muted leading-relaxed mb-4">
              {detail.overview}
            </p>
          )}
          <ShowActions
            tmdbId={tmdbId}
            userShow={userShow ?? null}
            allEpisodesWatched={allEpisodesWatched}
          />
        </div>
      </div>

      {seasonData.length > 0 && (
        <div className="space-y-2">
          {seasonData.map((season, index) => (
            <SeasonSection
              key={season.seasonNumber}
              tmdbId={tmdbId}
              season={season}
              previousSeasonNumbers={seasonData
                .slice(0, index)
                .map((s) => s.seasonNumber)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
