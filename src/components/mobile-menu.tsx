"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { MenuDotsIcon, TvIcon, CalendarIcon, LibraryIcon } from "./icons";
import { UserAvatar } from "./user-avatar";
import { ThemeSelector } from "./theme-selector";
import { signOutAction } from "./sign-out-action";

const MENU_ITEMS = [
  { href: "/series", key: "series", icon: TvIcon },
  { href: "/calendar", key: "calendar", icon: CalendarIcon },
  { href: "/library", key: "library", icon: LibraryIcon },
] as const;

export function MobileMenu({ avatarUrl }: { avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center text-muted hover:text-foreground transition-colors md:hidden"
        aria-label={t("menu")}
      >
        <MenuDotsIcon />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-ink text-paper md:hidden">
            <div className="flex h-[75px] items-center justify-end px-4">
              <button
                onClick={() => setOpen(false)}
                className="relative size-7"
                aria-label={t("closeMenu")}
              >
                <span className="absolute left-1/2 top-1/2 h-[2.5px] w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-paper" />
                <span className="absolute left-1/2 top-1/2 h-[2.5px] w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-paper" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col px-4 py-2">
              {MENU_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-base uppercase tracking-wide transition-colors ${
                      active
                        ? "font-semibold text-paper underline underline-offset-4"
                        : "text-paper/70 hover:bg-paper/10 hover:text-paper"
                    }`}
                    style={{ borderRadius: "var(--radius-menu-row)" }}
                  >
                    <Icon />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <div
              className="flex flex-col gap-8 border-t border-paper/15 px-4 py-3"
              style={{ paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" }}
            >
              <ThemeSelector variant="menu" />
              <div className="flex flex-col gap-3">
                <Link
                  href="/settings"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/settings" || pathname.startsWith("/settings/")
                      ? "text-paper"
                      : "text-paper/70 hover:text-paper"
                  }`}
                >
                  {t("settings")}
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-sm text-paper/70 hover:text-paper transition-colors"
                  >
                    {tAuth("signOut")}
                  </button>
                </form>
              </div>
              <Link href="/settings" className="block" aria-label={t("settings")}>
                <UserAvatar
                  avatarUrl={avatarUrl}
                  className="size-9"
                  iconClassName="size-5"
                />
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
