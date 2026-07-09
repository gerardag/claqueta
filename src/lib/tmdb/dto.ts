const IMG_BASE = "https://image.tmdb.org/t/p";

function imageUrl(path: string | null | undefined, size: string): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

// ---- Search results ----

export interface TmdbSearchShowRaw {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
}

export interface ShowSearchResult {
  id: number;
  name: string;
  overview: string;
  posterUrl: string | null;
  firstAirDate: string;
}

export function normalizeSearchResult(raw: TmdbSearchShowRaw): ShowSearchResult {
  return {
    id: raw.id,
    name: raw.name,
    overview: raw.overview,
    posterUrl: imageUrl(raw.poster_path, "w342"),
    firstAirDate: raw.first_air_date,
  };
}

// ---- Show detail ----

export interface TmdbSeasonRaw {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

export interface TmdbShowDetailRaw {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  next_episode_to_air: { air_date: string } | null;
  seasons: TmdbSeasonRaw[];
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterUrl: string | null;
}

export interface ShowDetail {
  id: number;
  name: string;
  originalName: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  firstAirDate: string;
  status: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  nextAirDate: string | null;
  seasons: SeasonSummary[];
}

export function normalizeShowDetail(raw: TmdbShowDetailRaw): ShowDetail {
  return {
    id: raw.id,
    name: raw.name,
    originalName: raw.original_name,
    overview: raw.overview,
    posterUrl: imageUrl(raw.poster_path, "w342"),
    backdropUrl: imageUrl(raw.backdrop_path, "w780"),
    firstAirDate: raw.first_air_date,
    status: raw.status,
    numberOfSeasons: raw.number_of_seasons,
    numberOfEpisodes: raw.number_of_episodes,
    nextAirDate: raw.next_episode_to_air?.air_date ?? null,
    seasons: raw.seasons.map((s) => ({
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      airDate: s.air_date,
      posterUrl: imageUrl(s.poster_path, "w185"),
    })),
  };
}

// ---- Season detail (episodes) ----

export interface TmdbEpisodeRaw {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
}

export interface TmdbSeasonDetailRaw {
  id: number;
  season_number: number;
  name: string;
  episodes: TmdbEpisodeRaw[];
}

export interface EpisodeDto {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  runtime: number | null;
  stillUrl: string | null;
}

export interface SeasonDetail {
  seasonNumber: number;
  name: string;
  episodes: EpisodeDto[];
}

export function normalizeSeasonDetail(raw: TmdbSeasonDetailRaw): SeasonDetail {
  return {
    seasonNumber: raw.season_number,
    name: raw.name,
    episodes: raw.episodes.map((e) => ({
      id: e.id,
      episodeNumber: e.episode_number,
      name: e.name,
      overview: e.overview,
      airDate: e.air_date,
      runtime: e.runtime,
      stillUrl: imageUrl(e.still_path, "w300"),
    })),
  };
}
