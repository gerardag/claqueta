"use client";

import { useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/components/toast";
import { updateAccountAction } from "./actions";

const MAX_AVATAR_SIZE = 400;

async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_AVATAR_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/png",
    );
  });
}

export function AccountSection({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const t = useTranslations("pages.settings.account");
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [state, formAction, pending] = useActionState(updateAccountAction, null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append("avatar", resized, "avatar.png");

      const res = await fetch("/api/avatar", { method: "POST", body: formData });
      if (!res.ok) {
        showToast(t("avatarError"));
        return;
      }
      setPreview(URL.createObjectURL(resized));
      showToast(t("avatarSaved"));
    } catch {
      showToast(t("avatarError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    try {
      const res = await fetch("/api/avatar", { method: "DELETE" });
      if (!res.ok) {
        showToast(t("avatarError"));
        return;
      }
      setPreview(null);
      showToast(t("avatarSaved"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar avatarUrl={preview} className="size-16" iconClassName="size-7" />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 bg-surface border border-border rounded-md text-xs hover:border-foreground transition-colors disabled:opacity-50"
            >
              {t("changeAvatar")}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                {t("removeAvatar")}
              </button>
            )}
          </div>
          <p className="text-xs text-muted">{t("avatarHint")}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p role="status" className="text-sm text-green-500">
            {t("saved")}
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="displayName" className="text-sm font-medium">
            {t("displayName")}
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={name}
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
            defaultValue={email}
            autoComplete="email"
            required
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="newPassword" className="text-sm font-medium">
            {t("newPassword")}
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder={t("newPasswordPlaceholder")}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            {t("currentPassword")}
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-muted">{t("currentPasswordHint")}</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
      </form>
    </div>
  );
}
