import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getCompletedShowsWithPending } from "@/lib/db/queries";
import { RegularitzaList } from "./regularitza-list";
import { RefreshIcon } from "@/components/icons";

export default async function RegularitzaPage() {
  const t = await getTranslations("pages.regularitza");
  const user = await requireUser();
  const shows = getCompletedShowsWithPending(db, Number(user.id));

  return (
    <div>
      <h1 className="font-display font-bold text-3xl tracking-tight mb-2">{t("title")}</h1>
      <p className="text-muted mb-6">{t("description")}</p>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <RefreshIcon className="size-14 text-muted mb-4" />
          <p className="text-muted">{t("empty")}</p>
        </div>
      ) : (
        <RegularitzaList shows={shows} />
      )}
    </div>
  );
}
