"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  year: number;
  month: number;
}

export function MonthNav({ year, month }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("pages.calendar");

  const label = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  function navigate(offset: number) {
    const d = new Date(year, month + offset, 1);
    const params = new URLSearchParams();
    params.set("y", String(d.getFullYear()));
    params.set("m", String(d.getMonth()));
    router.push(`/calendar?${params.toString()}`);
  }

  function goToday() {
    router.push("/calendar");
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={() => navigate(-1)}
        className="px-2 py-1 rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
      >
        ←
      </button>
      <h2 className="text-lg font-medium capitalize flex-1 text-center md:text-left md:flex-none">
        {label}
      </h2>
      <button
        onClick={() => navigate(1)}
        className="px-2 py-1 rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
      >
        →
      </button>
      <button
        onClick={goToday}
        className="ml-2 px-3 py-1 text-sm rounded bg-accent text-accent-fg hover:opacity-90 transition-opacity"
      >
        {t("today")}
      </button>
    </div>
  );
}
