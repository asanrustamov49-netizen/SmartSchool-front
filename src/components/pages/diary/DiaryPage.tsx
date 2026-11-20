"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, MessageSquareText, Printer, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import type { AttendanceCode, DiaryLesson, GradesSummary, PeriodKey, SubjectSummary } from "@/apis/journal.api";
import { ChildTabs } from "@/components/ui/ChildTabs";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useDiary, useGradesSummary, useStudentMonth } from "@/hooks/useJournal";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { JournalMonthTable, MonthSwitcher } from "../journal/JournalMonthTable";
import adminStyles from "../admin/admin.module.scss";
import journalStyles from "../journal/journal.module.scss";
import styles from "./diary.module.scss";
import { ReportCard } from "./ReportCard";

const DAYS_IN_WEEK = 7;

// Ж — отсутствовал, К — опоздал, С — по одобренной заявке. «Б» (был) отдельно не отмечается.
const ATTENDANCE_CLASS: Record<AttendanceCode, string | undefined> = {
  Б: undefined,
  Ж: styles.attendanceAbsent,
  К: styles.attendanceLate,
  С: styles.attendanceExcused,
};

function toDateString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Понедельник недели, в которую попадает дата.
function getMonday(date: Date) {
  const shift = (date.getDay() + 6) % 7;
  const monday = addDays(date, -shift);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function averageTone(average: number | null) {
  if (average === null) {
    return undefined;
  }
  if (average >= 4.5) {
    return styles.toneGreat;
  }
  if (average >= 3.5) {
    return styles.toneGood;
  }
  if (average >= 2.5) {
    return styles.toneOk;
  }
  return styles.toneBad;
}

function GradeBadge({ value }: { value: number }) {
  return <span className={cn(journalStyles.grade, journalStyles[`grade${value}`])}>{value}</span>;
}

function LessonRow({ lesson }: { lesson: DiaryLesson }) {
  const t = useTranslations("diary");
  const tJournal = useTranslations("journal");
  // «Был» — обычная ситуация, отмечаем только пропуски и опоздания.
  const showAttendance = lesson.attendance !== null && lesson.attendance !== "Б";

  return (
    <li className={styles.lesson}>
      <div className={styles.lessonMain}>
        <strong>{lesson.subject_name}</strong>
        <small>{lesson.teacher_name}</small>
        {lesson.comment && (
          <p className={styles.comment}>
            <MessageSquareText size={14} aria-hidden="true" />
            {lesson.comment}
          </p>
        )}
      </div>
      <div className={styles.lessonSide}>
        {showAttendance && lesson.attendance && (
          <span className={cn(styles.attendance, ATTENDANCE_CLASS[lesson.attendance])}>
            {tJournal(`attendanceCodes.${lesson.attendance}`)}
          </span>
        )}
        {lesson.grade_value !== null && <GradeBadge value={lesson.grade_value} />}
        {lesson.xp > 0 && <span className={styles.xp}>{t("xp", { count: lesson.xp })}</span>}
      </div>
    </li>
  );
}

function SummaryCards({ summary }: { summary: GradesSummary }) {
  const t = useTranslations("diary");
  const gradesCount = summary.subjects.reduce((total, subject) => total + subject.grades_count, 0);

  const cards = [
    {
      label: t("overallAverage"),
      value: summary.overall_average?.toFixed(2) ?? "—",
      tone: averageTone(summary.overall_average),
    },
    { label: t("gradesCount"), value: String(gradesCount) },
    { label: t("absences"), value: String(summary.attendance["Ж"] ?? 0) },
    { label: t("lates"), value: String(summary.attendance["К"] ?? 0) },
  ];

  return (
    <div className={styles.summaryCards}>
      {cards.map((card) => (
        <div key={card.label} className={styles.summaryCard}>
          <span className={cn(styles.summaryValue, card.tone)}>{card.value}</span>
          <span>{card.label}</span>
        </div>
      ))}
    </div>
  );
}

const TREND_WIDTH = 96;
const TREND_HEIGHT = 28;

// Мини-график среднего балла по месяцам (шкала 2–5). Нужны хотя бы два месяца.
function TrendLine({ trend }: { trend: SubjectSummary["trend"] }) {
  const t = useTranslations("diary");

  if (trend.length < 2) {
    return null;
  }

  const points = trend.map((month, index) => {
    const x = (index / (trend.length - 1)) * (TREND_WIDTH - 4) + 2;
    const y = TREND_HEIGHT - 2 - ((month.average - 2) / 3) * (TREND_HEIGHT - 4);
    return { x, y };
  });
  const first = trend[0].average;
  const last = trend[trend.length - 1].average;
  const direction = last > first + 0.05 ? "up" : last < first - 0.05 ? "down" : "flat";
  const lastPoint = points[points.length - 1];

  return (
    <svg
      className={cn(styles.trend, styles[`trend_${direction}`])}
      width={TREND_WIDTH}
      height={TREND_HEIGHT}
      viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
      role="img"
      aria-label={t(`trend.${direction}`, { from: first.toFixed(1), to: last.toFixed(1) })}
    >
      <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r={2.5} />
    </svg>
  );
}

const PERIOD_KEYS: PeriodKey[] = ["Q1", "Q2", "Q3", "Q4", "YEAR"];

// Четвертные и годовая: показываются, когда учитель поставил хотя бы одну.
function PeriodGradesRow({ periodGrades }: { periodGrades: SubjectSummary["period_grades"] }) {
  const tJournal = useTranslations("journal");
  const periods = PERIOD_KEYS.filter((period) => periodGrades?.[period] !== undefined);

  if (periods.length === 0) {
    return null;
  }

  return (
    <div className={styles.periodGrades}>
      {periods.map((period) => (
        <span key={period}>
          {tJournal(`periodNames.${period}`)}
          <GradeBadge value={periodGrades?.[period] ?? 0} />
        </span>
      ))}
    </div>
  );
}

function SubjectsSummary({ summary }: { summary: GradesSummary }) {
  const t = useTranslations("diary");

  if (summary.subjects.length === 0) {
    return <DataState status="empty" message={t("noSubjects")} />;
  }

  return (
    <ul className={styles.subjects}>
      {summary.subjects.map((subject) => (
        <li key={subject.subject_id}>
          <div className={styles.subjectHead}>
            <strong>{subject.subject_name}</strong>
            <TrendLine trend={subject.trend} />
            <span className={cn(styles.subjectAverage, averageTone(subject.average))}>
              {subject.average?.toFixed(1) ?? "—"}
            </span>
          </div>
          <div className={styles.lastGrades}>
            {subject.last_grades.length === 0 ? (
              <small>{t("noGradesYet")}</small>
            ) : (
              subject.last_grades.map((grade, index) => <GradeBadge key={index} value={grade} />)
            )}
            <small className={styles.subjectXp}>{t("xp", { count: subject.xp })}</small>
          </div>
          <PeriodGradesRow periodGrades={subject.period_grades} />
        </li>
      ))}
    </ul>
  );
}

// «Мой табель»: предметы × дни месяца, как бумажный табель.
function StudentMonthCard({ studentId, enabled }: { studentId: number | null; enabled: boolean }) {
  const t = useTranslations("diary");
  const tApiErrors = useTranslations("apiErrors");
  const today = toDateString(new Date());
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const monthQuery = useStudentMonth(studentId, month, enabled);

  const renderTable = () => {
    if (monthQuery.isPending) {
      return <DataState status="loading" />;
    }
    if (monthQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(monthQuery.error, tApiErrors)}
          onRetry={() => monthQuery.refetch()}
        />
      );
    }
    if (monthQuery.data.rows.length === 0) {
      return <DataState status="empty" message={t("noSubjects")} />;
    }
    return (
      <JournalMonthTable
        month={monthQuery.data.month}
        rows={monthQuery.data.rows.map((row) => ({ ...row, id: row.subject_id, title: row.subject_name }))}
        today={today}
        titleHeader={t("monthTable.subject")}
        hint={t("monthTable.hint")}
      />
    );
  };

  return (
    <section className={cn(adminStyles.card, styles.monthCard)}>
      <div className={styles.monthCardHeading}>
        <h2 className={adminStyles.cardTitle}>
          <LayoutGrid size={17} aria-hidden="true" /> {t("monthTable.title")}
        </h2>
        <MonthSwitcher month={month} maxMonth={currentMonth} onChange={setMonth} />
      </div>
      {renderTable()}
    </section>
  );
}

function StudentDiary({ user }: { user: CurrentUser }) {
  const t = useTranslations("diary");
  const tApiErrors = useTranslations("apiErrors");
  const { formatLongDate, formatDate } = useDateFormat();
  const isParent = user.role === "PARENT";
  const children = user.children ?? [];
  const { selectedChildId, selectChild } = useSelectedChild(children);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const studentId = isParent ? selectedChildId : null;
  const enabled = !isParent || studentId !== null;

  const weekEnd = addDays(weekStart, DAYS_IN_WEEK - 1);
  const isCurrentWeek = toDateString(weekStart) === toDateString(getMonday(new Date()));
  const diaryQuery = useDiary(studentId, toDateString(weekStart), toDateString(weekEnd), enabled);
  const summaryQuery = useGradesSummary(studentId, enabled);
  const selectedChild = children.find((child) => child.id === studentId);
  const className = isParent ? (selectedChild?.class_name ?? null) : (user.student?.class_name ?? null);
  const hasGrades = (summaryQuery.data?.subjects.length ?? 0) > 0;

  if (isParent && children.length === 0) {
    return <DataState status="empty" message={t("noChildren")} action={{ label: t("linkChild"), href: "/" }} />;
  }

  // Понедельник–суббота всегда; воскресенье — только если в нём есть записи.
  const daysWithLessons = new Map((diaryQuery.data?.days ?? []).map((day) => [day.date, day.lessons]));
  const weekDays = Array.from({ length: DAYS_IN_WEEK }, (_, index) => toDateString(addDays(weekStart, index)))
    .filter((day, index) => index < 6 || daysWithLessons.has(day));

  const renderWeek = () => {
    if (diaryQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (diaryQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(diaryQuery.error, tApiErrors)}
          onRetry={() => diaryQuery.refetch()}
        />
      );
    }

    return (
      <div className={styles.days}>
        {weekDays.map((day) => {
          const lessons = daysWithLessons.get(day) ?? [];
          return (
            <article key={day} className={cn(styles.day, lessons.length === 0 && styles.dayEmpty)}>
              <h3>{formatLongDate(day)}</h3>
              {lessons.length === 0 ? (
                <p className={styles.dayNote}>{t("noEntries")}</p>
              ) : (
                <ul className={styles.lessons}>
                  {lessons.map((lesson) => (
                    <LessonRow key={lesson.entry_id} lesson={lesson} />
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {isParent && (
        <ChildTabs
          childrenList={children}
          selectedId={studentId}
          onSelect={selectChild}
          label={t("child")}
        />
      )}

      {summaryQuery.data && <SummaryCards summary={summaryQuery.data} />}

      <div className={styles.layout}>
        <section className={adminStyles.card}>
          <div className={styles.weekNav}>
            <button
              type="button"
              className={styles.weekButton}
              aria-label={t("previousWeek")}
              onClick={() => setWeekStart(addDays(weekStart, -DAYS_IN_WEEK))}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <div className={styles.weekTitle}>
              <strong>{isCurrentWeek ? t("thisWeek") : t("week")}</strong>
              <span>
                {formatDate(toDateString(weekStart))} — {formatDate(toDateString(weekEnd))}
              </span>
            </div>
            <button
              type="button"
              className={styles.weekButton}
              aria-label={t("nextWeek")}
              disabled={isCurrentWeek}
              onClick={() => setWeekStart(addDays(weekStart, DAYS_IN_WEEK))}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            {!isCurrentWeek && (
              <button
                type="button"
                className={adminStyles.linkButton}
                onClick={() => setWeekStart(getMonday(new Date()))}
              >
                {t("backToToday")}
              </button>
            )}
          </div>
          {renderWeek()}
        </section>

        <section className={adminStyles.card}>
          <h2 className={adminStyles.cardTitle}>
            <Sparkles size={17} aria-hidden="true" /> {t("subjectsTitle")}
          </h2>
          {hasGrades && (
            <button type="button" className={adminStyles.linkButton} onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" />
              {t("reportCard.download")}
            </button>
          )}
          {summaryQuery.isPending && <DataState status="loading" />}
          {summaryQuery.isError && (
            <DataState
              status="error"
              message={handleApiError(summaryQuery.error, tApiErrors)}
              onRetry={() => summaryQuery.refetch()}
            />
          )}
          {summaryQuery.data && <SubjectsSummary summary={summaryQuery.data} />}
        </section>
      </div>
      <StudentMonthCard key={studentId ?? "me"} studentId={studentId} enabled={enabled} />

      {summaryQuery.data && hasGrades && (
        <ReportCard
          summary={summaryQuery.data}
          schoolName={user.school?.name ?? null}
          className={className}
          date={formatDate(new Date())}
        />
      )}
    </>
  );
}

export function DiaryPage() {
  const t = useTranslations("diary");
  const user = useCurrentUser().data;

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>
      {user ? <StudentDiary user={user} /> : <DataState status="loading" />}
    </div>
  );
}
