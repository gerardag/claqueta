import { useTranslations } from "next-intl";

export default function ImportPage() {
  const t = useTranslations("pages.import");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>
    </div>
  );
}
