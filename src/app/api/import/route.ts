import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { imports } from "@/lib/db/schema";
import { detectAndParse } from "@/lib/import/parse-tvtime";
import { parseClaquetaExport } from "@/lib/import/parse-claqueta";
import { runImportPipeline } from "@/lib/import/pipeline";
import { runClaquetaPipeline } from "@/lib/import/claqueta-pipeline";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await getTranslations("pages.import");
  const userId = Number(session.user.id);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: t("error") }, { status: 400 });
  }

  const fileEntries: File[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof File) fileEntries.push(value);
  }

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: t("noFiles") }, { status: 400 });
  }

  const firstFile = fileEntries[0];

  if (firstFile.name.endsWith(".json")) {
    return handleClaquetaImport(firstFile, userId, t);
  }

  return handleTvTimeImport(fileEntries, userId, t);
}

async function handleClaquetaImport(
  file: File,
  userId: number,
  t: Awaited<ReturnType<typeof getTranslations<"pages.import">>>,
) {
  const text = await file.text();

  let parsed;
  try {
    parsed = parseClaquetaExport(text);
  } catch {
    return NextResponse.json({ error: t("invalidFormat") }, { status: 400 });
  }

  if (parsed.shows.length === 0) {
    return NextResponse.json({ error: t("noShows") }, { status: 400 });
  }

  const importRow = db
    .insert(imports)
    .values({
      userId,
      source: "claqueta",
      totalShows: parsed.shows.length,
    })
    .returning()
    .get();

  runClaquetaPipeline(importRow.id, userId, parsed.shows).catch((err) => {
    console.error("Claqueta import pipeline error:", err);
    db.update(imports)
      .set({
        status: "error",
        skippedJson: JSON.stringify([{ reason: t("serverError") }]),
      })
      .where(eq(imports.id, importRow.id))
      .run();
  });

  return NextResponse.json({ importId: importRow.id });
}

async function handleTvTimeImport(
  fileEntries: File[],
  userId: number,
  t: Awaited<ReturnType<typeof getTranslations<"pages.import">>>,
) {
  const existingImport = db
    .select({ id: imports.id })
    .from(imports)
    .where(
      and(
        eq(imports.userId, userId),
        eq(imports.source, "tvtime"),
        eq(imports.status, "done"),
      ),
    )
    .get();

  if (existingImport) {
    return NextResponse.json({ error: t("alreadyImported") }, { status: 409 });
  }

  const files: { name: string; content: string }[] = [];

  for (const file of fileEntries) {
    if (file.name.endsWith(".zip")) {
      const { unzipCsvFiles } = await import("@/lib/import/unzip");
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const extracted = await unzipCsvFiles(buffer);
        files.push(...extracted);
      } catch (e) {
        console.error("Unzip error:", e);
        return NextResponse.json(
          { error: t("unzipError") },
          { status: 400 },
        );
      }
    } else if (file.name.endsWith(".csv")) {
      const text = await file.text();
      files.push({ name: file.name, content: text });
    }
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: t("noFiles") },
      { status: 400 },
    );
  }

  const parsed = detectAndParse(files);

  if (parsed.shows.length === 0) {
    return NextResponse.json(
      { error: t("noShows") },
      { status: 400 },
    );
  }

  const importRow = db
    .insert(imports)
    .values({
      userId,
      source: "tvtime",
      totalShows: parsed.shows.length,
    })
    .returning()
    .get();

  runImportPipeline(importRow.id, userId, parsed.shows, parsed.episodes, parsed.episodeCountByShow).catch(
    (err) => {
      console.error("Import pipeline error:", err);
      db.update(imports)
        .set({
          status: "error",
          skippedJson: JSON.stringify([
            { reason: t("serverError") },
          ]),
        })
        .where(eq(imports.id, importRow.id))
        .run();
    },
  );

  return NextResponse.json({ importId: importRow.id });
}
