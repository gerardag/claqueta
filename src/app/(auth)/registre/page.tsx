import { notFound } from "next/navigation";
import { RegisterForm } from "./register-form";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function RegisterPage() {
  if (process.env.ALLOW_REGISTRATION === "false") {
    notFound();
  }

  const t = useTranslations("auth");

  return (
    <>
      <h1 className="text-2xl font-bold text-center">{t("registerTitle")}</h1>
      <RegisterForm />
      <p className="text-center text-sm text-muted">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-foreground hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </>
  );
}
