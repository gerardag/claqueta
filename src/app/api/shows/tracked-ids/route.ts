import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTrackedTmdbIds } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const tmdbIds = getTrackedTmdbIds(db, userId);

  return NextResponse.json({ tmdbIds });
}
