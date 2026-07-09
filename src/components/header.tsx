"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { MenuIcon, CloseIcon } from "./icons";
import {
  TvIcon,
  CalendarIcon,
  SearchIcon,
  LibraryIcon,
  SettingsIcon,
} from "./icons";

function NavItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function Header({ userMenu }: { userMenu?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => setOpen(!open)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <MenuIcon />
        </button>
        <Link href="/series" className="flex items-center">
          <img
            src="/claqueta-white.svg"
            alt={tApp("title")}
            className="logo-dark h-5 w-auto"
          />
          <img
            src="/claqueta-black.svg"
            alt={tApp("title")}
            className="logo-light h-5 w-auto"
          />
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={close}
          />
          <nav className="relative z-10 flex w-72 max-w-[80vw] flex-col bg-surface border-r border-border animate-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center">
                <img
                  src="/claqueta-white.svg"
                  alt={tApp("title")}
                  className="logo-dark h-5 w-auto"
                />
                <img
                  src="/claqueta-black.svg"
                  alt={tApp("title")}
                  className="logo-light h-5 w-auto"
                />
              </div>
              <button
                onClick={close}
                className="text-muted hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-1 p-3">
              <NavItem href="/series" icon={<TvIcon />} onClick={close}>
                {t("series")}
              </NavItem>
              <NavItem href="/calendar" icon={<CalendarIcon />} onClick={close}>
                {t("calendar")}
              </NavItem>
              <NavItem href="/search" icon={<SearchIcon />} onClick={close}>
                {t("search")}
              </NavItem>
              <NavItem href="/library" icon={<LibraryIcon />} onClick={close}>
                {t("library")}
              </NavItem>
              <NavItem href="/settings" icon={<SettingsIcon />} onClick={close}>
                {t("settings")}
              </NavItem>
            </div>
            {userMenu && (
              <div className="border-t border-border p-3">{userMenu}</div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
