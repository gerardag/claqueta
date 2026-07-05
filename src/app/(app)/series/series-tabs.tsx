"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ShowWithProgress } from "@/lib/db/queries";
import { ShowCard } from "./show-card";

export function SeriesTabs({
  completed,
  stopped,
}: {
  completed: ShowWithProgress[];
  stopped: ShowWithProgress[];
}) {
  const t = useTranslations("pages.series");
  const [activeTab, setActiveTab] = useState<"completed" | "stopped">(
    completed.length > 0 ? "completed" : "stopped",
  );

  const tabs = [
    { key: "completed" as const, label: t("sections.completed"), count: completed.length },
    { key: "stopped" as const, label: t("sections.stopped"), count: stopped.length },
  ].filter((tab) => tab.count > 0);

  const items = activeTab === "completed" ? completed : stopped;

  return (
    <section className="mb-8">
      <div className="flex gap-4 mb-3 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-foreground border-b-2 border-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((show) => (
          <ShowCard key={show.userShowId} show={show} />
        ))}
      </div>
    </section>
  );
}
