import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fetchTmdb } from "@/lib/tmdb/client";
import { TmdbRateLimitError } from "@/lib/tmdb/client";
import { normalizeSearchResult, type TmdbSearchShowRaw } from "@/lib/tmdb/dto";

const searchSchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = searchSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { query, page } = parsed.data;

  try {
    const data = await fetchTmdb<{ results: TmdbSearchShowRaw[]; total_results: number; total_pages: number }>(
      "/search/tv",
      { query, page: String(page) },
      "search",
    );

    return NextResponse.json({
      results: data.results.map(normalizeSearchResult),
      totalResults: data.total_results,
      totalPages: data.total_pages,
    });
  } catch (e) {
    if (e instanceof TmdbRateLimitError) {
      return NextResponse.json(
        { error: "Massa peticions a TMDB. Torna-ho a provar d'aquí a una estona." },
        { status: 503 },
      );
    }
    console.error("[search] TMDB error:", e);
    return NextResponse.json(
      { error: "Error cercant a TMDB" },
      { status: 502 },
    );
  }
}
