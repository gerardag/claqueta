import { getCached, setCache } from "@/lib/tmdb/cache";

export type ScareLevel = "si" | "mig" | "no";

export interface ScareResult {
  scared: ScareLevel;
  label: string;
  subtitle: string;
}

export async function fetchScare(
  tmdbId: number,
  type: "tv" | "movie" = "tv",
): Promise<ScareResult | null> {
  const baseUrl = process.env.FA_POR_API_URL;
  if (!baseUrl) return null;

  const cacheKey = `scare:${type}:${tmdbId}`;
  const cached = getCached<ScareResult>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${baseUrl}/api/scare?type=${type}&id=${tmdbId}`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as ScareResult;
    setCache(cacheKey, data, "scare");
    return data;
  } catch {
    return null;
  }
}
