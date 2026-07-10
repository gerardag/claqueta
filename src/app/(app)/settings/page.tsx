import { getLocale, getTranslations } from "next-intl/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { imports } from "@/lib/db/schema";
import { LocaleSelector } from "./locale-selector";
import { ThemeSelector } from "@/components/theme-selector";
import { UserMenu } from "@/components/user-menu";
import { ExportSection } from "./export-section";
import { ImportSection, TvTimeImportDone } from "./import-section";

export default async function SettingsPage() {
  const t = await getTranslations("pages.settings");
  const locale = await getLocale();

  const session = await auth();
  const userId = Number(session?.user?.id);

  const tvTimeImportDone = userId
    ? !!db
        .select({ id: imports.id })
        .from(imports)
        .where(
          and(
            eq(imports.userId, userId),
            eq(imports.source, "tvtime"),
            eq(imports.status, "done"),
          ),
        )
        .get()
    : false;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display font-bold text-2xl tracking-tight">{t("title")}</h1>

      <section className="md:hidden bg-surface rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-3">{t("account.title")}</h2>
        <UserMenu name={session?.user?.name ?? ""} />
      </section>

      <section className="bg-surface rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-1">{t("theme.title")}</h2>
        <p className="text-xs text-muted mb-3">{t("theme.description")}</p>
        <ThemeSelector />
      </section>

      <section className="bg-surface rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-1">{t("language")}</h2>
        <p className="text-xs text-muted mb-3">{t("languageDescription")}</p>
        <LocaleSelector currentLocale={locale} />
      </section>

      <section className="bg-surface rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-1">{t("export.title")}</h2>
        <ExportSection />
      </section>

      <section className="bg-surface rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-1">{t("restore.title")}</h2>
        <ImportSection accept=".json" translationPrefix="claqueta" />
      </section>

      <section className="bg-surface rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-1">{t("import.title")}</h2>
        {tvTimeImportDone ? (
          <TvTimeImportDone />
        ) : (
          <ImportSection accept=".zip,.csv" translationPrefix="tvtime" />
        )}
      </section>
    </div>
  );
}
