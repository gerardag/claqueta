"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function ExportSection() {
  const t = useTranslations("pages.settings.export");
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] ?? "claqueta-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-muted mb-3">{t("description")}</p>
      <button
        type="button"
        onClick={handleExport}
        disabled={downloading}
        className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
      >
        {downloading ? t("downloading") : t("button")}
      </button>
    </div>
  );
}
