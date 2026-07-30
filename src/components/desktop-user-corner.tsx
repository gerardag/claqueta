"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { UserAvatar } from "./user-avatar";
import { ThemeSelector } from "./theme-selector";
import { signOutAction } from "./sign-out-action";

export function DesktopUserCorner({ avatarUrl }: { avatarUrl: string | null }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const active = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <div
      className="hidden md:block fixed z-30 group"
      style={{ left: 32, bottom: 32 }}
    >
      <button type="button" className="block rounded-full" aria-label={t("settings")}>
        <UserAvatar avatarUrl={avatarUrl} className="size-9" iconClassName="size-5" />
      </button>

      <div className="absolute bottom-full left-0 flex w-max flex-col gap-8 pb-4 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
        <ThemeSelector />
        <div className="flex flex-col gap-3">
          <Link
            href="/settings"
            className={`text-sm font-medium transition-colors ${
              active ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t("settings")}
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {tAuth("signOut")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
