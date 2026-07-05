import { useTranslations } from "next-intl";
import { NavLink } from "./nav-link";
import {
  TvIcon,
  CalendarIcon,
  SearchIcon,
  DownloadIcon,
  SettingsIcon,
} from "./icons";

export function Sidebar({ userMenu }: { userMenu?: React.ReactNode }) {
  const t = useTranslations("nav");

  return (
    <aside className="flex md:flex-col gap-1 md:gap-0.5 md:w-56 border-b md:border-b-0 md:border-r border-border bg-surface p-2 md:p-3">
      <div className="hidden md:flex items-center gap-2 px-3 py-3 mb-2">
        <span className="text-lg font-semibold tracking-tight">
          Claqueta 🎬
        </span>
      </div>
      <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto md:overflow-x-visible">
        <NavLink href="/series" icon={<TvIcon />}>
          {t("series")}
        </NavLink>
        <NavLink href="/calendar" icon={<CalendarIcon />}>
          {t("calendar")}
        </NavLink>
        <NavLink href="/search" icon={<SearchIcon />}>
          {t("search")}
        </NavLink>
        <NavLink href="/import" icon={<DownloadIcon />}>
          {t("import")}
        </NavLink>
        <NavLink href="/settings" icon={<SettingsIcon />}>
          {t("settings")}
        </NavLink>
      </nav>
      {userMenu && <div className="hidden md:block">{userMenu}</div>}
    </aside>
  );
}
