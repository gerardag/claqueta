import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("pages.settings");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>
    </div>
  );
}
