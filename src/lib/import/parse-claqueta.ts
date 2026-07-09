export interface ClaquetaExport {
  exportedAt: string;
  version: number;
  shows: ClaquetaShow[];
}

export interface ClaquetaShow {
  tmdbId: number;
  name: string;
  state: "WATCHING" | "FOLLOWING" | "COMPLETED" | "STOPPED";
  createdAt: number | string;
  lastActivityAt: number | string;
  watchedEpisodes: {
    season: number;
    episode: number;
    watchedAt: number | string;
  }[];
}

export function parseClaquetaExport(json: string): ClaquetaExport {
  const data = JSON.parse(json);

  if (!data || typeof data !== "object" || !Array.isArray(data.shows) || data.version !== 1) {
    throw new Error("Invalid Claqueta export format");
  }

  return data as ClaquetaExport;
}
