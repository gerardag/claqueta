"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";

export function DesktopNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-fg"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            <Icon />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
