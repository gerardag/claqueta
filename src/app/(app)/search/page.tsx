import { useTranslations } from "next-intl";

export default function SearchPage() {
  const t = useTranslations("pages.search");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>
    </div>
  );
}
