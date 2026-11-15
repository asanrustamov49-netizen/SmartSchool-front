"use client";

import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { useTodaySchedule } from "@/hooks/useSchedule";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { Link } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import scheduleStyles from "../schedule/schedule.module.scss";
import scss from "./home.module.scss";

function currentTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// «Уроки сегодня» для учителя, ученика и родителя (у родителя — выбранный ребёнок).
// Идущий сейчас урок подсвечивается.
export function TodayLessonsPanel({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("schedule");
  const tApiErrors = useTranslations("apiErrors");
  const children = currentUser.role === "PARENT" ? (currentUser.children ?? []) : [];
  const { selectedChildId } = useSelectedChild(children);
  const child = children.find((item) => item.id === selectedChildId);
  const todayQuery = useTodaySchedule(child?.id ?? null);
  const now = currentTimeString();
  const isTeacher = currentUser.role === "TEACHER" || currentUser.role === "CLASS_TEACHER";

  const renderContent = () => {
    if (todayQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (todayQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(todayQuery.error, tApiErrors)}
          onRetry={() => todayQuery.refetch()}
        />
      );
    }

    if (todayQuery.data.lessons.length === 0) {
      return <DataState status="empty" message={t("noLessonsToday")} />;
    }

    return (
      <ul className={scheduleStyles.todayList}>
        {todayQuery.data.lessons.map((lesson) => {
          const isCurrent = lesson.start_time <= now && now < lesson.end_time;

          return (
            <li key={lesson.id} className={cn(isCurrent && scheduleStyles.todayCurrent)}>
              <span className={scheduleStyles.mobileTime}>
                <strong>{lesson.lesson_number}</strong>
                <small>{lesson.start_time}</small>
              </span>
              <div className={scheduleStyles.lesson}>
                <strong>
                  {lesson.subject_name ?? "—"}
                  {isCurrent && ` · ${t("now")}`}
                </strong>
                <small>{isTeacher ? lesson.class_name : lesson.teacher_name}</small>
                {lesson.room && (
                  <small className={scheduleStyles.room}>{t("room", { room: lesson.room })}</small>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <CalendarClock size={20} aria-hidden="true" />
          <h2>{t("today")}</h2>
        </div>
        <Link href="/schedule" className={scss.panelMeta}>
          {child ? t("todayFor", { name: child.full_name }) : t("openWeek")}
        </Link>
      </div>
      {renderContent()}
    </section>
  );
}
