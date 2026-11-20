"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";
import type { AttendanceCode, JournalMonthCell } from "@/apis/journal.api";
import { cn } from "@/lib/utils";
import styles from "./journal.module.scss";

const SCROLL_STEP_PX = 320;

const ATTENDANCE_CLASSES: Record<AttendanceCode, string> = {
  Б: "",
  Ж: styles.attendanceAbsent,
  К: styles.attendanceLate,
  С: styles.attendanceExcused,
};

// Строка табеля: у учителя — ученик, в дневнике ученика — предмет.
export type MonthTableRow = {
  id: number;
  number: number;
  title: string;
  cells: JournalMonthCell[];
  average: number | null;
  absent_count: number;
};

type JournalMonthTableProps = {
  month: string;
  rows: MonthTableRow[];
  today: string;
  titleHeader: string;
  hint: string;
  // Дни недели урока по расписанию (1 — понедельник); подсвечиваются в шапке.
  lessonWeekdays?: number[];
  // Без обработчика табель только для просмотра: дни не кликабельны.
  onOpenDay?: (day: string) => void;
};

// "2026-11" + 1 → "2026-12"
export function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

type MonthSwitcherProps = {
  month: string;
  // Позже этого месяца листать нельзя (будущее).
  maxMonth: string;
  onChange: (month: string) => void;
};

// «‹ Ноябрь 2026 ›» — переключатель месяца табеля.
export function MonthSwitcher({ month, maxMonth, onChange }: MonthSwitcherProps) {
  const t = useTranslations("journal");
  const tDates = useTranslations("dates");
  const monthNamesRaw: unknown = tDates.raw("monthNames");
  const monthNames = Array.isArray(monthNamesRaw) ? monthNamesRaw.map(String) : [];
  const label = `${monthNames[Number(month.slice(5)) - 1] ?? ""} ${month.slice(0, 4)}`;

  return (
    <div className={styles.monthSwitcher}>
      <button type="button" aria-label={t("prevMonth")} onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <strong>{label}</strong>
      <button
        type="button"
        aria-label={t("nextMonth")}
        disabled={month >= maxMonth}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

// "2026-11" → ["2026-11-01", …, "2026-11-30"]
function getMonthDays(month: string): string[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

function getWeekday(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).getDay();
}

// Табель: строки × дни месяца, как в бумажном журнале.
// У учителя клик по дню открывает редактор этого дня.
export function JournalMonthTable({
  month,
  rows,
  today,
  titleHeader,
  hint,
  lessonWeekdays = [],
  onOpenDay,
}: JournalMonthTableProps) {
  const t = useTranslations("journal");
  const tDates = useTranslations("dates");
  const weekdaysRaw: unknown = tDates.raw("weekdaysShort");
  const weekdaysShort = Array.isArray(weekdaysRaw) ? weekdaysRaw.map(String) : [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = getMonthDays(month);

  // Открываем табель так, чтобы сегодняшний день был у правого края, а прошедшие дни — видны.
  useEffect(() => {
    const wrap = scrollRef.current;
    const todayHeader = wrap?.querySelector<HTMLElement>("[data-today]");
    if (wrap && todayHeader) {
      wrap.scrollLeft = todayHeader.offsetLeft + todayHeader.offsetWidth * 2 - wrap.clientWidth;
    }
  }, [month]);

  const scrollBy = (direction: number) => {
    scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: "smooth" });
  };

  const renderDay = (day: string, content: ReactNode, focusable: boolean) => {
    if (!onOpenDay) {
      return <span className={styles.dayContent}>{content}</span>;
    }
    return (
      <button
        type="button"
        className={styles.dayContent}
        tabIndex={focusable ? undefined : -1}
        disabled={day > today}
        aria-label={t("openDay", { date: day })}
        onClick={() => onOpenDay(day)}
      >
        {content}
      </button>
    );
  };

  const renderCell = (cell: JournalMonthCell | undefined) => {
    if (!cell) {
      return null;
    }
    if (cell.grade_value !== null) {
      return <span className={cn(styles.grade, styles[`grade${cell.grade_value}`])}>{cell.grade_value}</span>;
    }
    // «Был» без оценки — обычный случай, не загромождаем табель буквой.
    if (cell.attendance === "Б") {
      return <span className={styles.presentDot} aria-label={t("attendanceCodes.Б")} />;
    }
    if (cell.attendance) {
      return (
        <span
          className={cn(styles.attendanceMark, ATTENDANCE_CLASSES[cell.attendance])}
          title={t(`attendanceCodes.${cell.attendance}`)}
        >
          {cell.attendance}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <div className={styles.monthToolbar}>
        <p className={styles.keyboardHint}>{hint}</p>
        <div className={styles.scrollButtons}>
          <button type="button" aria-label={t("scrollLeft")} onClick={() => scrollBy(-1)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" aria-label={t("scrollRight")} onClick={() => scrollBy(1)}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Телефон: вместо узкой матрицы — карточки, как в бумажном дневнике:
          строка, средний балл и отметки месяца с числом под каждой. */}
      <ul className={styles.monthCards}>
        {rows.map((row) => {
          const marks = row.cells.filter((cell) => cell.grade_value !== null || (cell.attendance && cell.attendance !== "Б"));
          return (
            <li key={row.id}>
              <div className={styles.monthCardHead}>
                <strong>{row.title}</strong>
                <span className={cn(styles.monthCardAverage, row.average !== null && styles[`grade${Math.round(row.average)}`])}>
                  {row.average?.toFixed(1) ?? "—"}
                </span>
              </div>
              {marks.length === 0 ? (
                <small className={styles.monthCardEmpty}>{t("noMarks")}</small>
              ) : (
                <div className={styles.monthCardMarks}>
                  {marks.map((cell) => (
                    <span key={cell.date} className={styles.monthCardMark}>
                      {renderDay(cell.date, renderCell(cell), true)}
                      <small>{Number(cell.date.slice(8))}</small>
                    </span>
                  ))}
                </div>
              )}
              {row.absent_count > 0 && (
                <small className={styles.monthCardAbsent}>{t("absencesCount", { count: row.absent_count })}</small>
              )}
            </li>
          );
        })}
      </ul>

      <div className={cn(styles.monthWrap, styles.monthMatrix)} ref={scrollRef}>
        <table className={styles.monthTable}>
          <thead>
            <tr>
              <th className={styles.stickyNumber}>№</th>
              <th className={styles.stickyName}>{titleHeader}</th>
              {days.map((day) => {
                const weekday = getWeekday(day);
                // В lessonWeekdays понедельник = 1, у getDay() воскресенье = 0.
                const isLessonDay = lessonWeekdays.includes(weekday === 0 ? 7 : weekday);
                return (
                  <th
                    key={day}
                    data-today={day === today ? "" : undefined}
                    className={cn(
                      styles.dayHeader,
                      isLessonDay && styles.lessonDay,
                      weekday === 0 && styles.sunday,
                      day === today && styles.today,
                    )}
                    title={isLessonDay ? t("lessonDay") : undefined}
                  >
                    {renderDay(
                      day,
                      <>
                        <strong>{day.slice(8)}</strong>
                        <small>{weekdaysShort[weekday]}</small>
                      </>,
                      true,
                    )}
                  </th>
                );
              })}
              <th className={styles.totalHeader}>{t("averageShort")}</th>
              <th className={styles.totalHeader}>{t("absencesShort")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cellsByDay = new Map(row.cells.map((cell) => [cell.date, cell]));
              return (
                <tr key={row.id}>
                  <td className={styles.stickyNumber}>{row.number}</td>
                  <td className={styles.stickyName} title={row.title}>
                    {row.title}
                  </td>
                  {days.map((day) => {
                    const cell = cellsByDay.get(day);
                    return (
                      <td
                        key={day}
                        className={cn(styles.dayCell, getWeekday(day) === 0 && styles.sunday)}
                        title={cell?.comment ?? undefined}
                      >
                        {renderDay(day, renderCell(cell), false)}
                      </td>
                    );
                  })}
                  <td className={styles.totalCell}>{row.average?.toFixed(1) ?? "—"}</td>
                  <td className={styles.totalCell}>{row.absent_count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
