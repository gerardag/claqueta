"use client";

import { useTranslations } from "next-intl";
import { signOutAction } from "./sign-out-action";

export function UserMenu({ name }: { name: string }) {
  const t = useTranslations("auth");

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
