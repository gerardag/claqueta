import { LoginForm } from "./login-form";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations("auth");

  return (
    <>
      <h1 className="text-2xl font-bold text-center">{t("loginTitle")}</h1>
      <LoginForm />
      {process.env.ALLOW_REGISTRATION !== "false" && (
        <p className="text-center text-sm text-muted">
          {t("noAccount")}{" "}
          <Link href="/registre" className="text-accent hover:underline">
            {t("registerLink")}
          </Link>
        </p>
      )}
    </>
  );
}
