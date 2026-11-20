"use client";

import { CalendarDays, LayoutGrid, Trophy } from "lucide-react";
import { useIsMutating } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import {
  SAVE_JOURNAL_DAY_KEY,
  useJournalAssignments,
  useJournalDay,
  useJournalMonth,
  usePeriodGrades,
} from "@/hooks/useJournal";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { JournalMonthTable, MonthSwitcher } from "./JournalMonthTable";
import { JournalPeriods } from "./JournalPeriods";
import { JournalTable } from "./JournalTable";
import adminStyles from "../admin/admin.module.scss";
import styles from "./journal.module.scss";

type JournalView = "month" | "day" | "periods";

const VIEWS: { value: JournalView; icon: typeof LayoutGrid }[] = [
  { value: "month", icon: LayoutGrid },
  { value: "day", icon: CalendarDays },
  { value: "periods", icon: Trophy },
];

const LAST_ASSIGNMENT_KEY = "smart-school-journal-assignment";

// Журнал открывается на последнем выбранном классе и предмете.
function readLastAssignment(): number | null {
  try {
    const value = Number(window.localStorage.getItem(LAST_ASSIGNMENT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

// Дата в формате YYYY-MM-DD по местному времени (toISOString дал бы дату по UTC).
function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function JournalPage() {
  const t = useTranslations("journal");
  const tApiErrors = useTranslations("apiErrors");
  const today = getTodayString();
  const currentMonth = today.slice(0, 7);
  const assignmentsQuery = useJournalAssignments();
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    typeof window === "undefined" ? null : readLastAssignment(),
  );
  const [view, setView] = useState<JournalView>("month");
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(currentMonth);

  const assignments = assignmentsQuery.data ?? [];
  // Без сохранённого выбора — первый свой предмет: в чужом журнале оценки ставить нельзя.
  const defaultAssignment = assignments.find((assignment) => assignment.can_edit) ?? assignments[0];
  const assignmentId = assignments.some((assignment) => assignment.id === selectedId)
    ? selectedId
    : (defaultAssignment?.id ?? null);

  const selectAssignment = (id: number) => {
    setSelectedId(id);
    try {
      window.localStorage.setItem(LAST_ASSIGNMENT_KEY, String(id));
    } catch {
      // Без localStorage выбор просто не запомнится.
    }
  };

  // Запрос идёт только для открытого вида: остальные получают null и не грузятся.
  // Пока сохраняются оценки дня (например, при уходе на табель), день не загружается заново:
  // иначе редактор открылся бы с данными до сохранения.
  const isSavingDay = useIsMutating({ mutationKey: SAVE_JOURNAL_DAY_KEY }) > 0;
  const dayQuery = useJournalDay(view === "day" ? assignmentId : null, day, !isSavingDay);
  const monthQuery = useJournalMonth(view === "month" ? assignmentId : null, month);
  const periodsQuery = usePeriodGrades(view === "periods" ? assignmentId : null);
  const activeQuery = view === "day" ? dayQuery : view === "month" ? monthQuery : periodsQuery;

  const openDay = (selectedDay: string) => {
    setDay(selectedDay);
    setView("day");
  };

  const changeDay = (value: string) => {
    const nextDay = value || today;
    setDay(nextDay);
    setMonth(nextDay.slice(0, 7));
  };

  const renderJournal = () => {
    if (assignmentsQuery.isPending || (assignmentId !== null && activeQuery.isPending)) {
      return <DataState status="loading" />;
    }

    if (assignmentsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(assignmentsQuery.error, tApiErrors)}
          onRetry={() => assignmentsQuery.refetch()}
        />
      );
    }

    if (assignments.length === 0) {
      return <DataState status="empty" message={t("noAssignments")} />;
    }

    if (activeQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(activeQuery.error, tApiErrors)}
          onRetry={() => activeQuery.refetch()}
        />
      );
    }

    if (view === "month" && monthQuery.data) {
      if (monthQuery.data.students.length === 0) {
        return <DataState status="empty" message={t("noStudents")} />;
      }
      const monthJournal = monthQuery.data;
      return (
        <JournalMonthTable
          month={monthJournal.month}
          rows={monthJournal.students.map((row) => ({ ...row, id: row.student_id, title: row.full_name }))}
          today={today}
          titleHeader={t("student")}
          hint={monthJournal.can_edit ? t("monthHint") : t("monthReadHint")}
          lessonWeekdays={monthJournal.lesson_weekdays}
          onOpenDay={openDay}
        />
      );
    }

    if (view === "periods" && periodsQuery.data) {
      if (periodsQuery.data.students.length === 0) {
        return <DataState status="empty" message={t("noStudents")} />;
      }
      // key сбрасывает черновик итоговых оценок при смене журнала.
      return <JournalPeriods key={assignmentId} journal={periodsQuery.data} today={today} />;
    }

    if (view === "day" && dayQuery.data) {
      if (dayQuery.data.students.length === 0) {
        return <DataState status="empty" message={t("noStudents")} />;
      }
      // key сбрасывает черновик оценок при смене журнала или даты.
      return <JournalTable key={`${assignmentId}-${day}`} journal={dayQuery.data} isFutureDay={day > today} />;
    }

    return null;
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

      <section className={adminStyles.card}>
        <div className={styles.journalToolbar}>
          <Select
            ariaLabel={t("assignment")}
            className={styles.assignmentSelect}
            value={assignmentId === null ? "" : String(assignmentId)}
            disabled={assignments.length === 0}
            onValueChange={(value) => selectAssignment(Number(value))}
            options={assignments.map((assignment) => ({
              value: String(assignment.id),
              label: [assignment.class_name, assignment.subject_name, assignment.teacher_name]
                .filter(Boolean)
                .join(" · "),
            }))}
          />

          {view === "month" && <MonthSwitcher month={month} maxMonth={currentMonth} onChange={setMonth} />}

          {view === "day" && (
            <input
              type="date"
              className={`${adminStyles.input} ${styles.dateInput}`}
              aria-label={t("date")}
              value={day}
              max={today}
              onChange={(event) => changeDay(event.target.value)}
            />
          )}
        </div>

        <div className={cn(styles.tabs, styles.viewTabs)} role="tablist" aria-label={t("viewsLabel")}>
          {VIEWS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              className={cn(styles.tab, view === value && styles.tabActive)}
              onClick={() => setView(value)}
            >
              <Icon size={16} aria-hidden="true" />
              {t(`views.${value}`)}
            </button>
          ))}
        </div>

        {renderJournal()}
      </section>
    </div>
  );
}
