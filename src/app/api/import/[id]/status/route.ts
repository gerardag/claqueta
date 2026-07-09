import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { imports } from "@/lib/db/schema";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const row = db
    .select()
    .from(imports)
    .where(
      and(
        eq(imports.id, parsed.data.id),
        eq(imports.userId, Number(session.user.id)),
      ),
    )
    .get();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    status: row.status,
    totalShows: row.totalShows,
    processedShows: row.processedShows,
    importedShows: row.importedShows,
    importedEpisodes: row.importedEpisodes,
    skippedShows: row.skippedShows,
    skippedJson: row.skippedJson ? JSON.parse(row.skippedJson) : [],
  });
}
