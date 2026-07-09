import { db } from "@/lib/db";
import { tmdbCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type TtlCategory = "search" | "show" | "season" | "airing" | "find";

const TTL_MS: Record<TtlCategory, number> = {
  search: 24 * 60 * 60 * 1000,
  show: 24 * 60 * 60 * 1000,
  season: 7 * 24 * 60 * 60 * 1000,
  airing: 6 * 60 * 60 * 1000,
  find: 30 * 24 * 60 * 60 * 1000,
};

export function ttlMs(category: TtlCategory): number {
  return TTL_MS[category];
}

export function getCached<T>(key: string): T | null {
  const row = db.select().from(tmdbCache).where(eq(tmdbCache.key, key)).get();
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    db.delete(tmdbCache).where(eq(tmdbCache.key, key)).run();
    return null;
  }
  return JSON.parse(row.payloadJson) as T;
}

export function setCache(key: string, data: unknown, category: TtlCategory): void {
  const expiresAt = new Date(Date.now() + TTL_MS[category]);
  db.insert(tmdbCache)
    .values({ key, payloadJson: JSON.stringify(data), expiresAt })
    .onConflictDoUpdate({
      target: tmdbCache.key,
      set: { payloadJson: JSON.stringify(data), expiresAt },
    })
    .run();
}
