"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { registerAction } from "./actions";

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="text-sm text-red-400 text-center">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
      >
        {pending ? t("loading") : t("register")}
      </button>
    </form>
  );
}
