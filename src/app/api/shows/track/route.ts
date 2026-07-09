import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userShows } from "@/lib/db/schema";
import { upsertShowFromTmdb } from "@/lib/tmdb/sync";

const bodySchema = z.object({
  tmdbId: z.number().int().positive(),
  state: z.enum(["WATCHING", "FOLLOWING"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const { tmdbId, state } = parsed.data;

  const showId = await upsertShowFromTmdb(tmdbId);

  const existing = db
    .select({ id: userShows.id })
    .from(userShows)
    .where(and(eq(userShows.userId, userId), eq(userShows.showId, showId)))
    .get();

  if (existing) {
    return NextResponse.json({ error: "Already tracked" }, { status: 409 });
  }

  db.insert(userShows)
    .values({ userId, showId, state })
    .run();

  return NextResponse.json({ ok: true, showId });
}
