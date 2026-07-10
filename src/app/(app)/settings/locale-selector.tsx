"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { changeLocaleAction } from "./actions";
import { useToast } from "@/components/toast";

export function LocaleSelector({ currentLocale }: { currentLocale: string }) {
  const tToast = useTranslations("toast");
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value as Locale;
    startTransition(async () => {
      await changeLocaleAction(newLocale);
      showToast(tToast("localeSaved"));
    });
  }

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      disabled={pending}
      className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors disabled:opacity-50"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
