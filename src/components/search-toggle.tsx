"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "./icons";

export function SearchToggle({ label }: { label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const open = pathname === "/search";

  if (open) {
    return (
      <button
        onClick={() => router.back()}
        className="relative size-7 md:hidden"
        aria-label={label}
      >
        <span className="absolute left-1/2 top-1/2 h-[2.5px] w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-foreground" />
        <span className="absolute left-1/2 top-1/2 h-[2.5px] w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-foreground" />
      </button>
    );
  }

  return (
    <Link
      href="/search"
      className="flex md:hidden items-center text-foreground"
      aria-label={label}
    >
      <SearchIcon className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}
