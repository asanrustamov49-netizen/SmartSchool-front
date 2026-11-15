"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { getClassName } from "@/apis/classes.api";
import type { ScheduleBells, ScheduleWeek } from "@/apis/schedule.api";
import { ChildTabs } from "@/components/ui/ChildTabs";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { useClasses } from "@/hooks/useClasses";
import { useJournalAssignments } from "@/hooks/useJournal";
import { useClassSchedule, useMySchedule, useScheduleBells } from "@/hooks/useSchedule";
import { handleApiError } from "@/lib/errorHandler";
import { LessonForm, type LessonDraft } from "./LessonForm";
import { ScheduleGrid } from "./ScheduleGrid";
import adminStyles from "../admin/admin.module.scss";

type WeekQuery = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: ScheduleWeek | undefined;
  refetch: () => unknown;
};

// Общие состояния загрузки и ошибок для любого вида недели.
function WeekState({ query, children }: { query: WeekQuery; children: (week: ScheduleWeek) => React.ReactNode }) {
  const tApiErrors = useTranslations("apiErrors");

  if (query.isPending) {
    return <DataState status="loading" />;
  }

  if (query.isError || !query.data) {
    return (
      <DataState
        status="error"
        message={handleApiError(query.error, tApiErrors)}
        onRetry={() => query.refetch()}
      />
    );
  }

  return <>{children(query.data)}</>;
}

// Директор и завуч: расписание выбранного класса с добавлением и изменением уроков.
function AdminSchedule({ bells }: { bells: ScheduleBells }) {
  const t = useTranslations("schedule");
  const classesQuery = useClasses();
  const assignmentsQuery = useJournalAssignments();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [draft, setDraft] = useState<LessonDraft | null>(null);

  const classes = classesQuery.data ?? [];
  const classId = selectedClassId ?? classes[0]?.id ?? null;
  const scheduleQuery = useClassSchedule(classId);
  const classAssignments = (assignmentsQuery.data ?? []).filter(
    (assignment) => assignment.class_id === classId,
  );

  if (classesQuery.isPending) {
    return <DataState status="loading" />;
  }

  if (classes.length === 0) {
    return <DataState status="empty" message={t("noClasses")} />;
  }

  return (
    <>
      <div className={adminStyles.toolbar}>
        <select
          className={adminStyles.select}
          aria-label={t("class")}
          value={classId ?? ""}
          onChange={(event) => {
            setDraft(null);
            setSelectedClassId(Number(event.target.value));
          }}
        >
          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {getClassName(schoolClass)} · {schoolClass.academic_year}
            </option>
          ))}
        </select>
        <span className={adminStyles.toolbarCount}>{t("adminHint")}</span>
      </div>

      {draft && (
        <LessonForm
          key={`${draft.lesson?.id ?? "new"}-${draft.weekday}-${draft.lessonNumber}`}
          draft={draft}
          assignments={classAssignments}
          bells={bells}
          onClose={() => setDraft(null)}
        />
      )}

      <WeekState query={scheduleQuery}>
        {(week) => (
          <ScheduleGrid
            lessons={week.lessons}
            bells={bells}
            secondary="teacher"
            onAdd={(weekday, lessonNumber) => setDraft({ lesson: null, weekday, lessonNumber })}
            onEdit={(lesson) =>
              setDraft({ lesson, weekday: lesson.weekday, lessonNumber: lesson.lesson_number })
            }
          />
        )}
      </WeekState>
    </>
  );
}

// Учитель, ученик и родитель: своё расписание только для просмотра.
function PersonalSchedule({ user, bells }: { user: CurrentUser; bells: ScheduleBells }) {
  const t = useTranslations("schedule");
  const children = user.children ?? [];
  const [childId, setChildId] = useState<number | null>(null);
  const isParent = user.role === "PARENT";
  const studentId = isParent ? (childId ?? children[0]?.id ?? null) : null;
  const scheduleQuery = useMySchedule(studentId, !isParent || studentId !== null);

  if (isParent && children.length === 0) {
    return <DataState status="empty" message={t("noChildren")} />;
  }

  return (
    <>
      {isParent && (
        <ChildTabs
          childrenList={children}
          selectedId={studentId}
          onSelect={setChildId}
          label={t("child")}
        />
      )}

      <WeekState query={scheduleQuery}>
        {(week) =>
          week.lessons.length === 0 ? (
            <DataState status="empty" message={t("empty")} />
          ) : (
            <ScheduleGrid
              lessons={week.lessons}
              bells={bells}
              secondary={user.role === "TEACHER" || user.role === "CLASS_TEACHER" ? "class" : "teacher"}
            />
          )
        }
      </WeekState>
    </>
  );
}

export function SchedulePage() {
  const t = useTranslations("schedule");
  const tApiErrors = useTranslations("apiErrors");
  const currentUserQuery = useCurrentUser();
  const bellsQuery = useScheduleBells();
  const user = currentUserQuery.data;
  const isAdmin = user?.role === "DIRECTOR" || user?.role === "DEPUTY";

  const renderContent = () => {
    if (!user || bellsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (bellsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(bellsQuery.error, tApiErrors)}
          onRetry={() => bellsQuery.refetch()}
        />
      );
    }

    return isAdmin ? (
      <AdminSchedule bells={bellsQuery.data} />
    ) : (
      <PersonalSchedule user={user} bells={bellsQuery.data} />
    );
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{isAdmin ? t("descriptionAdmin") : t("description")}</p>
        </div>
      </header>
      <section className={adminStyles.card}>{renderContent()}</section>
    </div>
  );
}
