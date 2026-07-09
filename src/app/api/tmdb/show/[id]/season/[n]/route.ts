import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fetchTmdb, TmdbRateLimitError } from "@/lib/tmdb/client";
import { normalizeSeasonDetail, type TmdbSeasonDetailRaw } from "@/lib/tmdb/dto";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  n: z.coerce.number().int().min(0),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const raw = await fetchTmdb<TmdbSeasonDetailRaw>(
      `/tv/${parsed.data.id}/season/${parsed.data.n}`,
      {},
      "season",
    );
    return NextResponse.json(normalizeSeasonDetail(raw));
  } catch (e) {
    if (e instanceof TmdbRateLimitError) {
      return NextResponse.json(
        { error: "Massa peticions a TMDB. Torna-ho a provar d'aquí a una estona." },
        { status: 503 },
      );
    }
    throw e;
  }
}
