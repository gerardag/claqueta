import {
  TvIcon,
  CalendarIcon,
  SearchIcon,
  LibraryIcon,
  SettingsIcon,
} from "./icons";

export const NAV_ITEMS = [
  { href: "/series", key: "series", icon: TvIcon },
  { href: "/calendar", key: "calendar", icon: CalendarIcon },
  { href: "/search", key: "search", icon: SearchIcon },
  { href: "/library", key: "library", icon: LibraryIcon },
  { href: "/settings", key: "settings", icon: SettingsIcon },
] as const;
