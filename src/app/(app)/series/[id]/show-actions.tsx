"use client";

import { useTranslations } from "next-intl";
import type { UserShow } from "@/lib/db/schema";
import { changeShowStateAction, markShowWatchedAction } from "./actions";
import { useToast } from "@/components/toast";
import { EyeIcon } from "@/components/icons";

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
  const isFollowing = state === "WATCHING" || state === "FOLLOWING";

  async function toggleFollow() {
    if (isFollowing) {
      await changeShowStateAction(tmdbId, "STOPPED");
      showToast(tToast("showStopped"));
    } else if (state === "STOPPED") {
      await changeShowStateAction(tmdbId, "WATCHING");
      showToast(tToast("showResumed"));
    } else {
      await changeShowStateAction(tmdbId, "FOLLOWING");
      showToast(tToast("showFollowed"));
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={toggleFollow}
        aria-pressed={isFollowing}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-accent ${
          isFollowing ? "bg-accent text-accent-fg" : "bg-surface-hover text-foreground"
        }`}
      >
        <EyeIcon className="size-4 shrink-0" crossed={isFollowing} />
        {isFollowing
          ? t("actions.stop")
          : state === "STOPPED"
            ? t("actions.resume")
            : t("actions.follow")}
      </button>
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
        <span
          className="text-sm px-3 py-1.5 rounded-md"
          style={{
            background: "var(--status-completed-bg)",
            color: "var(--status-completed-fg)",
          }}
        >
          ✓ {t("sections.completed")}
        </span>
      )}
    </div>
  );
}
