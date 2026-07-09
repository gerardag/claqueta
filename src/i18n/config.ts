export const defaultLocale = "ca" as const;

export const locales = ["ca"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  ca: "Català",
};
