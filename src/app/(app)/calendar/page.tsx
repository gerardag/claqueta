import { useTranslations } from "next-intl";

export default function CalendarPage() {
  const t = useTranslations("pages.calendar");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>
    </div>
  );
}
