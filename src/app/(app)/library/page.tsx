import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getLibraryShows } from "@/lib/db/queries";
import { LibraryGrid } from "./library-grid";
import Link from "next/link";

export default async function LibraryPage() {
  const t = await getTranslations("pages.library");
  const user = await requireUser();
  const shows = getLibraryShows(db, Number(user.id));

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-6xl mb-4">📚</p>
        <h1 className="text-2xl font-semibold mb-2">{t("title")}</h1>
        <p className="text-muted mb-6">{t("empty")}</p>
        <Link
          href="/search"
          className="bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          {t("searchCta")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t("title")}</h1>
      <LibraryGrid shows={shows} />
    </div>
  );
}
