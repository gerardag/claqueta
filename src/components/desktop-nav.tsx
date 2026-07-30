"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SearchIcon } from "./icons";
import { NAV_ITEMS } from "./nav-items";

const DESKTOP_NAV_KEYS = ["series", "calendar", "library"] as const;

export function DesktopNav({ title }: { title: string }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const items = NAV_ITEMS.filter((item) =>
    (DESKTOP_NAV_KEYS as readonly string[]).includes(item.key),
  );
  const searchActive = pathname === "/search" || pathname.startsWith("/search/");

  return (
    <nav
      className="hidden md:flex mx-auto items-center gap-1 bg-surface p-1"
      style={{ borderRadius: "var(--radius-pill)" }}
    >
      <Link href="/series" className="flex items-center px-3">
        <img src="/claqueta-white.svg" alt={title} className="logo-dark h-4 w-auto" />
        <img src="/claqueta-black.svg" alt={title} className="logo-light h-4 w-auto" />
      </Link>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground"
            }`}
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            {t(item.key)}
          </Link>
        );
      })}
      <Link
        href="/search"
        aria-label={t("search")}
        className={`flex items-center px-3 py-2 transition-colors ${
          searchActive
            ? "bg-accent text-accent-fg"
            : "text-muted hover:text-foreground"
        }`}
        style={{ borderRadius: "var(--radius-pill)" }}
      >
        <SearchIcon className="size-4" />
      </Link>
    </nav>
  );
}
