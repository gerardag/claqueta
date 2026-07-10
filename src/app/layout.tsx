import { Inter, Inter_Tight, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "@/components/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const t = await getTranslations("app");
  return {
    title: t("title"),
    description: t("description"),
    appleWebApp: {
      title: t("title"),
      statusBarStyle: "black-translucent",
    },
    icons: {
      apple: "/apple-touch-icon.png",
    },
  };
}

export function generateViewport() {
  return {
    themeColor: "#0f0e12",
    viewportFit: "cover" as const,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${interTight.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=document.cookie.match(/(?:^|;)\\s*theme=([^;]+)/);if(t&&t[1]==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="h-full">
        <NextIntlClientProvider messages={messages}>
          <Toaster>
            {children}
          </Toaster>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
