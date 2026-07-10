import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getCalendar } from "@/lib/db/queries";
import { refreshUpcoming } from "@/lib/tmdb/refresh";
import { CalendarGrid } from "./calendar-grid";
import { AgendaView } from "./agenda-view";
import { MonthNav } from "./month-nav";
import { UpcomingSection } from "./upcoming-section";

interface Props {
  searchParams: Promise<{ y?: string; m?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const t = await getTranslations("pages.calendar");
  const user = await requireUser();
  const userId = Number(user.id);

  const params = await searchParams;
  const now = new Date();
  const year = params.y ? parseInt(params.y, 10) : now.getFullYear();
  const month = params.m ? parseInt(params.m, 10) : now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const from = firstDay.toISOString().slice(0, 10);
  const to = lastDay.toISOString().slice(0, 10);

  const episodes = getCalendar(db, userId, from, to);

  const today = now.toISOString().slice(0, 10);
  const upcomingEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const upcoming = getCalendar(db, userId, today, upcomingEnd)
    .filter((ep) => ep.airDate > today)
    .slice(0, 5);

  // Lazy background refresh — doesn't block render
  refreshUpcoming(userId).catch(() => {});

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-tight mb-6">{t("title")}</h1>

      <UpcomingSection episodes={upcoming} />

      <MonthNav year={year} month={month} />
      <CalendarGrid episodes={episodes} year={year} month={month} />
      <AgendaView episodes={episodes} />
    </div>
  );
}
