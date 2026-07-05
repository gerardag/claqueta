"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function loginAction(_prev: unknown, formData: FormData) {
  const t = await getTranslations("auth");

  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("invalidCredentials") };
    }
    throw error;
  }

  redirect("/");
}
