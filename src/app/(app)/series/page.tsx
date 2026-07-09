import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getUserShowsGrouped } from "@/lib/db/queries";
import { ShowCard } from "./show-card";
import { WatchingCard } from "./watching-card";
import Link from "next/link";

export default async function SeriesPage() {
  const t = await getTranslations("pages.series");
  const user = await requireUser();
  const { watching, watchlist, stale, following, completed, stopped } =
    getUserShowsGrouped(db, Number(user.id));

  const isEmpty =
    watching.length === 0 &&
    watchlist.length === 0 &&
    following.length === 0 &&
    stale.length === 0 &&
    completed.length === 0 &&
    stopped.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-6xl mb-4">🎬</p>
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

      {watching.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">{t("sections.watching")}</h2>
          <div className="flex flex-col gap-2">
            {watching.map((show) => (
              <WatchingCard key={show.userShowId} show={show} />
            ))}
          </div>
        </section>
      )}

      {watchlist.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">
            {t("sections.watchlist")} 📋
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((show) => (
              <ShowCard key={show.userShowId} show={show} />
            ))}
          </div>
        </section>
      )}

      {following.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">{t("sections.following")}</h2>
            <Link
              href="/library"
              className="text-sm text-accent hover:opacity-80 transition-opacity"
            >
              {t("seeLibrary")}
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {following.slice(0, 10).map((show) => (
              <WatchingCard key={show.userShowId} show={show} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
