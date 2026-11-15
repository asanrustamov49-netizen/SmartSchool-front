"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ScheduleBells, ScheduleLesson } from "@/apis/schedule.api";
import { cn } from "@/lib/utils";
import styles from "./schedule.module.scss";

type ScheduleGridProps = {
  lessons: ScheduleLesson[];
  bells: ScheduleBells;
  // Что показывать в карточке урока вторым рядом: учителя (вид класса) или класс (вид учителя).
  secondary: "teacher" | "class";
  // Передаются только директору и завучу: клик по пустой ячейке и по уроку.
  onAdd?: (weekday: number, lessonNumber: number) => void;
  onEdit?: (lesson: ScheduleLesson) => void;
};

// День недели по сегодняшней дате: 1 — понедельник … 6 — суббота, в воскресенье — понедельник.
function getTodayWeekday() {
  const day = new Date().getDay();
  return day === 0 ? 1 : day;
}

// Неделя на компьютере — сетка «уроки × дни», на телефоне — вкладки дней со списком.
export function ScheduleGrid({ lessons, bells, secondary, onAdd, onEdit }: ScheduleGridProps) {
  const t = useTranslations("schedule");
  const [mobileDay, setMobileDay] = useState(getTodayWeekday);
  const canEdit = Boolean(onAdd && onEdit);

  // Показываем уроки до последнего занятого номера, но не меньше шести строк.
  const lastUsedNumber = Math.max(0, ...lessons.map((lesson) => lesson.lesson_number));
  const rowsCount = Math.max(6, lastUsedNumber + (canEdit ? 1 : 0));
  const rows = bells.bells.filter((bell) => bell.lesson_number <= Math.min(rowsCount, bells.bells.length));

  const findLessons = (weekday: number, lessonNumber: number) =>
    lessons.filter((lesson) => lesson.weekday === weekday && lesson.lesson_number === lessonNumber);

  const renderLesson = (lesson: ScheduleLesson) => {
    const content = (
      <>
        <strong>{lesson.subject_name ?? "—"}</strong>
        <small>{secondary === "teacher" ? lesson.teacher_name : lesson.class_name}</small>
        {lesson.room && <small className={styles.room}>{t("room", { room: lesson.room })}</small>}
      </>
    );

    if (onEdit) {
      return (
        <button
          key={lesson.id}
          type="button"
          className={cn(styles.lesson, styles.lessonButton)}
          onClick={() => onEdit(lesson)}
        >
          {content}
        </button>
      );
    }

    return (
      <div key={lesson.id} className={styles.lesson}>
        {content}
      </div>
    );
  };

  const renderCell = (weekday: number, lessonNumber: number) => {
    const cellLessons = findLessons(weekday, lessonNumber);

    if (cellLessons.length > 0) {
      return cellLessons.map(renderLesson);
    }

    if (onAdd) {
      return (
        <button
          type="button"
          className={styles.addCell}
          aria-label={t("addAt", { day: t(`weekdays.${weekday}`), number: lessonNumber })}
          onClick={() => onAdd(weekday, lessonNumber)}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      );
    }

    return <span className={styles.emptyCell} aria-hidden="true" />;
  };

  const mobileLessons = lessons
    .filter((lesson) => lesson.weekday === mobileDay)
    .sort((first, second) => first.lesson_number - second.lesson_number);

  return (
    <>
      <div className={styles.gridWrap}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th className={styles.numberHead}>{t("lesson")}</th>
              {bells.weekdays.map((day) => (
                <th key={day.weekday} className={cn(day.weekday === getTodayWeekday() && styles.today)}>
                  {t(`weekdays.${day.weekday}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((bell) => (
              <tr key={bell.lesson_number}>
                <th scope="row" className={styles.numberCell}>
                  <strong>{bell.lesson_number}</strong>
                  <small>
                    {bell.start_time}–{bell.end_time}
                  </small>
                </th>
                {bells.weekdays.map((day) => (
                  <td key={day.weekday}>{renderCell(day.weekday, bell.lesson_number)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobile}>
        <div className={styles.dayTabs} role="tablist" aria-label={t("weekday")}>
          {bells.weekdays.map((day) => (
            <button
              key={day.weekday}
              type="button"
              role="tab"
              aria-selected={mobileDay === day.weekday}
              className={cn(styles.dayTab, mobileDay === day.weekday && styles.dayTabActive)}
              onClick={() => setMobileDay(day.weekday)}
            >
              {t(`weekdaysShort.${day.weekday}`)}
            </button>
          ))}
        </div>

        {mobileLessons.length === 0 ? (
          <p className={styles.mobileEmpty}>{t("noLessonsDay")}</p>
        ) : (
          <ul className={styles.mobileList}>
            {mobileLessons.map((lesson) => (
              <li key={lesson.id}>
                <span className={styles.mobileTime}>
                  <strong>{lesson.lesson_number}</strong>
                  <small>
                    {lesson.start_time}–{lesson.end_time}
                  </small>
                </span>
                {renderLesson(lesson)}
              </li>
            ))}
          </ul>
        )}

        {onAdd && (
          <button
            type="button"
            className={styles.mobileAdd}
            onClick={() => onAdd(mobileDay, Math.min(lastUsedNumber + 1, bells.bells.length))}
          >
            <Plus size={16} aria-hidden="true" />
            {t("addLesson")}
          </button>
        )}
      </div>
    </>
  );
}
