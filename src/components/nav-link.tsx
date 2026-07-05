"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
}
