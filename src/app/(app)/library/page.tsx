import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getLibraryShows } from "@/lib/db/queries";
import { LibraryGrid } from "./library-grid";
import { LibraryIcon } from "@/components/icons";
import Link from "next/link";

export default async function LibraryPage() {
  const t = await getTranslations("pages.library");
  const user = await requireUser();
  const shows = getLibraryShows(db, Number(user.id));

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <LibraryIcon className="size-14 text-muted mb-4" />
        <h1 className="font-display font-bold text-3xl tracking-tight mb-2">{t("title")}</h1>
        <p className="text-muted mb-6">{t("empty")}</p>
        <Link
          href="/search"
          className="bg-accent text-accent-fg px-4 py-2 font-medium hover:opacity-90 transition-opacity"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          {t("searchCta")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl tracking-tight mb-6">{t("title")}</h1>
      <LibraryGrid shows={shows} />
    </div>
  );
}
