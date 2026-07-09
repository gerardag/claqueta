import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";
import ca from "../../messages/ca.json";

const messages: Record<string, typeof ca> = { ca };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value;
  const locale: Locale =
    raw && (locales as readonly string[]).includes(raw)
      ? (raw as Locale)
      : defaultLocale;

  return {
    locale,
    messages: messages[locale] ?? messages[defaultLocale],
  };
});
