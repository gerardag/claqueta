"use client";

import { useTranslations } from "next-intl";
import type { UserShow } from "@/lib/db/schema";
import { changeShowStateAction, markShowWatchedAction } from "./actions";
import { useToast } from "@/components/toast";

interface Props {
  tmdbId: number;
  userShow: (UserShow & { showId: number }) | null;
}

export function ShowActions({ tmdbId, userShow }: Props) {
  const t = useTranslations("pages.series");
  const tToast = useTranslations("toast");
  const showToast = useToast();

  const state = userShow?.state ?? null;

  return (
    <div className="flex flex-wrap gap-2">
      {state === "STOPPED" && (
        <button
          onClick={async () => {
            await changeShowStateAction(tmdbId, "WATCHING");
            showToast(tToast("showResumed"));
          }}
          className="text-sm bg-accent text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity focus-visible:outline-accent"
        >
          {t("actions.resume")}
        </button>
      )}
      {state !== "WATCHING" && state !== "FOLLOWING" && (
        <button
          onClick={async () => {
            await changeShowStateAction(tmdbId, "FOLLOWING");
            showToast(tToast("showFollowed"));
          }}
          className="text-sm bg-surface-hover text-muted px-3 py-1.5 rounded-md hover:text-foreground transition-colors focus-visible:outline-accent"
        >
          {t("actions.follow")}
        </button>
      )}
      {(state === "WATCHING" || state === "FOLLOWING") && (
        <button
          onClick={async () => {
            await changeShowStateAction(tmdbId, "STOPPED");
            showToast(tToast("showStopped"));
          }}
          className="text-sm bg-surface-hover text-muted px-3 py-1.5 rounded-md hover:text-foreground transition-colors focus-visible:outline-accent"
        >
          {t("actions.stop")}
        </button>
      )}
      {state !== "COMPLETED" && (
        <button
          onClick={async () => {
            await markShowWatchedAction(tmdbId);
            showToast(tToast("showWatched"));
          }}
          className="text-sm bg-surface-hover text-muted px-3 py-1.5 rounded-md hover:text-foreground transition-colors focus-visible:outline-accent"
        >
          ✓ {t("sections.completed")}
        </button>
      )}
    </div>
  );
}
