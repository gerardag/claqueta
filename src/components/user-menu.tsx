"use client";

import { useTranslations } from "next-intl";
import { signOutAction } from "./sign-out-action";

export function UserMenu({
  name,
  variant = "inline",
}: {
  name: string;
  variant?: "inline" | "stacked";
}) {
  const t = useTranslations("auth");

  if (variant === "stacked") {
    return (
      <div className="flex flex-col px-3 py-2">
        <span className="text-base text-paper/70 truncate">{name}</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm uppercase tracking-wide text-paper/70 hover:text-paper transition-colors"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted truncate max-w-32">{name}</span>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}
