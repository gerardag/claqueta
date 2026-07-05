import { useTranslations } from "next-intl";

export default function SeriesPage() {
  const t = useTranslations("pages.series");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>
      <p className="text-muted">{t("empty")}</p>
    </div>
  );
}
