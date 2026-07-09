import Papa from "papaparse";

export interface TvTimeShow {
  tvdbId: number;
  name: string;
}

export interface TvTimeEpisode {
  tvdbShowId: number;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: Date | null;
}

export interface ParsedTvTime {
  shows: TvTimeShow[];
  episodes: TvTimeEpisode[];
  episodeCountByShow: Map<number, number>;
}

function findColumn(
  headers: string[],
  candidates: string[],
): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

function parseRows(csv: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

function parseShows(csv: string): TvTimeShow[] {
  const rows = parseRows(csv);
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const idCol = findColumn(headers, [
    "tv_show_id",
    "tvdb_id",
    "series_id",
    "show_id",
    "s_id",
    "id",
  ]);
  const nameCol = findColumn(headers, [
    "tv_show_name",
    "show_name",
    "series_name",
    "name",
    "title",
  ]);

  if (!idCol) return [];

  const shows: TvTimeShow[] = [];
  for (const row of rows) {
    const id = parseInt(row[idCol], 10);
    if (isNaN(id) || id <= 0) continue;
    shows.push({ tvdbId: id, name: row[nameCol ?? ""] ?? `TVDB#${id}` });
  }
  return shows;
}

function parseEpisodes(
  csv: string,
  showNameToId?: Map<string, number>,
): TvTimeEpisode[] {
  const rows = parseRows(csv);
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const showIdCol = findColumn(headers, [
    "tv_show_id",
    "tvdb_id",
    "series_id",
    "show_id",
    "s_id",
  ]);
  const showNameCol = findColumn(headers, [
    "tv_show_name",
    "show_name",
    "series_name",
    "name",
  ]);
  const seasonCol = findColumn(headers, [
    "episode_season_number",
    "season_number",
    "s_no",
    "season",
  ]);
  const episodeCol = findColumn(headers, [
    "episode_number",
    "ep_no",
    "number",
    "episode",
  ]);
  const dateCol = findColumn(headers, [
    "created_at",
    "watched_at",
    "watch_date",
    "date",
    "updated_at",
  ]);

  if ((!showIdCol && !showNameCol) || !seasonCol || !episodeCol) return [];

  const episodes: TvTimeEpisode[] = [];
  for (const row of rows) {
    let showId: number | undefined;
    if (showIdCol) {
      showId = parseInt(row[showIdCol], 10);
      if (isNaN(showId) || showId <= 0) continue;
    } else if (showNameCol && showNameToId) {
      const name = row[showNameCol]?.trim();
      showId = name ? showNameToId.get(name) : undefined;
      if (!showId) continue;
    } else {
      continue;
    }

    const season = parseInt(row[seasonCol], 10);
    const episode = parseInt(row[episodeCol], 10);
    if (isNaN(season) || isNaN(episode)) continue;
    if (season < 0 || episode <= 0) continue;

    let watchedAt: Date | null = null;
    if (dateCol && row[dateCol]) {
      const raw = row[dateCol].trim();
      const asNum = Number(raw);
      const parsed = !isNaN(asNum) && /^\d+$/.test(raw)
        ? new Date(asNum < 1e12 ? asNum * 1000 : asNum)
        : new Date(raw);
      if (!isNaN(parsed.getTime())) watchedAt = parsed;
    }

    episodes.push({ tvdbShowId: showId, seasonNumber: season, episodeNumber: episode, watchedAt });
  }
  return episodes;
}

function parseEpisodeCounts(csv: string): Map<number, number> {
  const rows = parseRows(csv);
  if (rows.length === 0) return new Map();

  const headers = Object.keys(rows[0]);
  const idCol = findColumn(headers, ["tv_show_id", "tvdb_id", "series_id", "show_id", "s_id"]);
  const countCol = findColumn(headers, ["nb_episodes_seen"]);
  if (!idCol || !countCol) return new Map();

  const counts = new Map<number, number>();
  for (const row of rows) {
    const id = parseInt(row[idCol], 10);
    const count = parseInt(row[countCol], 10);
    if (!isNaN(id) && id > 0 && !isNaN(count) && count > 0) {
      counts.set(id, count);
    }
  }
  return counts;
}

export function detectAndParse(
  files: { name: string; content: string }[],
): ParsedTvTime {
  let shows: TvTimeShow[] = [];
  const episodeFiles: { name: string; content: string }[] = [];
  let episodeCountByShow = new Map<number, number>();

  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.includes("followed") && lower.includes("show")) {
      const parsed = parseShows(file.content);
      if (parsed.length > shows.length) shows = parsed;
    } else if (
      (lower.includes("seen") && lower.includes("episode")) ||
      (lower.includes("tracking") && lower.includes("records"))
    ) {
      episodeFiles.push(file);
    } else if (lower.includes("user_tv_show_data")) {
      const counts = parseEpisodeCounts(file.content);
      if (counts.size > episodeCountByShow.size) episodeCountByShow = counts;
    }
  }

  const showNameToId = new Map<string, number>();
  for (const s of shows) {
    showNameToId.set(s.name, s.tvdbId);
  }

  for (const file of episodeFiles) {
    const rows = parseRows(file.content);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const idCol = findColumn(headers, ["tv_show_id", "tvdb_id", "series_id", "show_id", "s_id"]);
    const nameCol = findColumn(headers, ["tv_show_name", "show_name", "series_name", "name"]);
    if (idCol && nameCol) {
      for (const row of rows) {
        const name = row[nameCol]?.trim();
        const id = parseInt(row[idCol], 10);
        if (name && !isNaN(id) && id > 0 && !showNameToId.has(name)) {
          showNameToId.set(name, id);
        }
      }
    }
  }

  const seen = new Set<string>();
  const episodes: TvTimeEpisode[] = [];
  for (const file of episodeFiles) {
    const parsed = parseEpisodes(file.content, showNameToId);
    for (const ep of parsed) {
      const key = `${ep.tvdbShowId}:${ep.seasonNumber}:${ep.episodeNumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        episodes.push(ep);
      }
    }
  }

  const knownShowIds = new Set(shows.map((s) => s.tvdbId));
  for (const ep of episodes) {
    if (!knownShowIds.has(ep.tvdbShowId)) {
      knownShowIds.add(ep.tvdbShowId);
      const name = [...showNameToId.entries()]
        .find(([, id]) => id === ep.tvdbShowId)?.[0];
      shows.push({ tvdbId: ep.tvdbShowId, name: name ?? `TVDB#${ep.tvdbShowId}` });
    }
  }

  return { shows, episodes, episodeCountByShow };
}
