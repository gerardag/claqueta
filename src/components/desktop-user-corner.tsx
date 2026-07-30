"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { UserIcon } from "./icons";
import { signOutAction } from "./sign-out-action";

export function DesktopUserCorner() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const active = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <div
      className="hidden md:flex fixed z-30 flex-col gap-2"
      style={{ left: 32, bottom: 32 }}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center size-9 rounded-full bg-surface text-muted">
          <UserIcon className="size-5" />
        </span>
        <Link
          href="/settings"
          className={`text-sm font-medium transition-colors ${
            active ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {t("settings")}
        </Link>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          {tAuth("signOut")}
        </button>
      </form>
    </div>
  );
}
