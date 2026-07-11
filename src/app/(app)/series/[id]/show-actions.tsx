"use client";

import { useTranslations } from "next-intl";
import type { UserShow } from "@/lib/db/schema";
import { changeShowStateAction, markShowWatchedAction } from "./actions";
import { useToast } from "@/components/toast";

interface Props {
  tmdbId: number;
  userShow: (UserShow & { showId: number }) | null;
  allEpisodesWatched: boolean;
}

export function ShowActions({ tmdbId, userShow, allEpisodesWatched }: Props) {
  const t = useTranslations("pages.series");
  const tToast = useTranslations("toast");
  const showToast = useToast();

  const state = userShow?.state ?? null;
  const completed = state === "COMPLETED" || allEpisodesWatched;

  return (
    <div className="flex flex-wrap gap-2">
      {state === "STOPPED" && (
        <button
          onClick={async () => {
            await changeShowStateAction(tmdbId, "WATCHING");
            showToast(tToast("showResumed"));
          }}
          className="text-sm bg-accent text-accent-fg px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity focus-visible:outline-accent"
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
          className="text-sm bg-surface-hover text-foreground px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity focus-visible:outline-accent"
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
          className="text-sm bg-surface-hover text-foreground px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity focus-visible:outline-accent"
        >
          {t("actions.stop")}
        </button>
      )}
      {!completed ? (
        <button
          onClick={async () => {
            await markShowWatchedAction(tmdbId);
            showToast(tToast("showWatched"));
          }}
          className="text-sm bg-surface-hover text-foreground px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity focus-visible:outline-accent"
        >
          ✓ {t("sections.completed")}
        </button>
      ) : (
        <span className="text-sm bg-accent text-accent-fg px-3 py-1.5 rounded-md">
          ✓ {t("sections.completed")}
        </span>
      )}
    </div>
  );
}
