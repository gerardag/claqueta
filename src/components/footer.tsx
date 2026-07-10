import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border py-4 px-4 md:px-8 text-xs text-muted flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
      <p>{t("madeWith")}</p>
      <p className="flex items-center gap-1.5">
        {t("tmdbAttribution")}
        <img src="/tmdb-logo.svg" alt="TMDb" className="h-2.5 w-auto" />
      </p>
    </footer>
  );
}
