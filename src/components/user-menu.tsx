"use client";

import { useTranslations } from "next-intl";
import { signOutAction } from "./sign-out-action";

export function UserMenu({ name }: { name: string }) {
  const t = useTranslations("auth");

  return (
    <div className="flex items-center gap-2 px-3 py-2 mt-auto border-t border-border pt-3">
      <span className="text-sm truncate flex-1">{name}</span>
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
