import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { DesktopNav } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";
import { SearchToggle } from "./search-toggle";

export async function Header({
  userMenu,
  mobileUserMenu,
}: {
  userMenu?: React.ReactNode;
  mobileUserMenu?: React.ReactNode;
}) {
  const t = await getTranslations("app");
  const tNav = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-30 mx-auto flex h-[75px] w-full max-w-[1024px] items-center gap-4 backdrop-blur-lg px-4">
      <Link href="/series" className="hidden md:flex items-center">
        <img
          src="/claqueta-white.svg"
          alt={t("title")}
          className="logo-dark h-5 w-auto"
        />
        <img
          src="/claqueta-black.svg"
          alt={t("title")}
          className="logo-light h-5 w-auto"
        />
      </Link>
      <SearchToggle label={tNav("search")} />
      <DesktopNav />
      {userMenu && <div className="hidden md:flex ml-auto items-center">{userMenu}</div>}
      <div className="ml-auto flex items-center gap-4 md:hidden">
        <MobileMenu userMenu={mobileUserMenu} />
      </div>
    </header>
  );
}
