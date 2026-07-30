import { getTranslations } from "next-intl/server";
import { DesktopNav } from "./desktop-nav";
import { DesktopUserCorner } from "./desktop-user-corner";
import { MobileMenu } from "./mobile-menu";
import { SearchToggle } from "./search-toggle";

export async function Header({
  avatarUrl,
}: {
  avatarUrl?: string | null;
}) {
  const t = await getTranslations("app");
  const tNav = await getTranslations("nav");

  return (
    <>
      <header className="sticky top-0 z-30 mx-auto flex h-[75px] w-full max-w-[1024px] items-center gap-4 backdrop-blur-lg px-4">
        <SearchToggle label={tNav("search")} />
        <DesktopNav title={t("title")} />
        <div className="ml-auto flex items-center gap-4 md:hidden">
          <MobileMenu avatarUrl={avatarUrl ?? null} />
        </div>
      </header>
      <DesktopUserCorner avatarUrl={avatarUrl ?? null} />
    </>
  );
}
