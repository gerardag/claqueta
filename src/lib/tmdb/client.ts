import { tryAcquire, msUntilAvailable } from "./rate-limiter";
import { getCached, setCache, type TtlCategory } from "./cache";

const BASE = "https://api.themoviedb.org/3";

function headers(): HeadersInit {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
}

async function rawFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { headers: headers(), signal: controller.signal });
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return fetch(url, { headers: headers(), signal: AbortSignal.timeout(10_000) });
    }
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000));
      return fetch(url, { headers: headers(), signal: AbortSignal.timeout(10_000) });
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTmdb<T>(
  path: string,
  params: Record<string, string> = {},
  ttlCategory: TtlCategory = "show",
): Promise<T> {
  const qs = new URLSearchParams({ ...params, language: "ca-ES" });
  const cacheKey = `${path}?${qs.toString()}`;

  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  if (!tryAcquire()) {
    const wait = msUntilAvailable();
    if (wait > 5000) {
      throw new TmdbRateLimitError(wait);
    }
    await new Promise((r) => setTimeout(r, wait));
    if (!tryAcquire()) {
      throw new TmdbRateLimitError(msUntilAvailable());
    }
  }

  const url = `${BASE}${path}?${qs.toString()}`;
  const res = await rawFetch(url);
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${path}`);
  }

  let data = (await res.json()) as T;

  data = await backfillEmpty(data, path, params);

  setCache(cacheKey, data, ttlCategory);
  return data;
}

async function backfillEmpty<T>(data: T, path: string, params: Record<string, string>): Promise<T> {
  const d = data as Record<string, unknown>;
  const needsBackfill =
    ("name" in d && !d.name) || ("overview" in d && !d.overview);
  if (!needsBackfill) return data;

  const qs = new URLSearchParams({ ...params, language: "en-US" });
  const url = `${BASE}${path}?${qs.toString()}`;
  const res = await rawFetch(url);
  if (!res.ok) return data;

  const fallback = (await res.json()) as Record<string, unknown>;
  if (!d.name && fallback.name) d.name = fallback.name;
  if (!d.overview && fallback.overview) d.overview = fallback.overview;
  return d as T;
}

export class TmdbRateLimitError extends Error {
  retryAfterMs: number;
  constructor(ms: number) {
    super("TMDB rate limit exceeded");
    this.retryAfterMs = ms;
  }
}

interface TmdbFindResult {
  tv_results: { id: number }[];
}

export async function findTmdbIdByTvdb(tvdbId: number): Promise<number | null> {
  const result = await fetchTmdb<TmdbFindResult>(
    `/find/${tvdbId}`,
    { external_source: "tvdb_id" },
    "find",
  );
  return result.tv_results[0]?.id ?? null;
}

interface TmdbSearchResult {
  results: { id: number; name: string }[];
}

export async function searchTmdbShow(name: string): Promise<number | null> {
  const result = await fetchTmdb<TmdbSearchResult>(
    "/search/tv",
    { query: name },
    "find",
  );
  return result.results[0]?.id ?? null;
}
