"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function BackButton() {
  const router = useRouter();
  const t = useTranslations("pages.showDetail");

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4 transition-colors"
    >
      ← {t("back")}
    </button>
  );
}
