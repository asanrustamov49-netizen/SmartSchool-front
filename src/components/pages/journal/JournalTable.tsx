"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { AttendanceCode, JournalDay, JournalRow } from "@/apis/journal.api";
import { Select } from "@/components/ui/Select";
import { useSaveJournalDay } from "@/hooks/useJournal";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./journal.module.scss";

const GRADES = [5, 4, 3, 2];
const AUTOSAVE_DELAY_MS = 1200;
// «С» учитель не ставит: её выставляет backend после одобрения заявки на отсутствие.
const EDITABLE_ATTENDANCE: AttendanceCode[] = ["Б", "Ж", "К"];

type DraftRow = {
  grade: number | null;
  attendance: AttendanceCode | null;
  comment: string;
};

function toDraft(row: JournalRow): DraftRow {
  return { grade: row.grade_value, attendance: row.attendance, comment: row.comment ?? "" };
}

type JournalTableProps = {
  journal: JournalDay;
  isFutureDay: boolean;
};

export function JournalTable({ journal, isFutureDay }: JournalTableProps) {
  const t = useTranslations("journal");
  const tApiErrors = useTranslations("apiErrors");
  const saveJournal = useSaveJournalDay();
  const canEdit = journal.can_edit && !isFutureDay;
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>(() =>
    Object.fromEntries(journal.students.map((row) => [row.student_id, toDraft(row)])),
  );
  // Номер последнего изменения и номер изменения, которое уже сохранено на сервере.
  const [changeVersion, setChangeVersion] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const isDirty = changeVersion !== savedVersion;

  const updateDraft = (studentId: number, change: Partial<DraftRow>) => {
    setDrafts((current) => {
      const next = { ...current[studentId], ...change };
      // Отсутствующему без причины backend не разрешает ставить оценку.
      if (next.attendance === "Ж") {
        next.grade = null;
      }
      return { ...current, [studentId]: next };
    });
    setChangeVersion((version) => version + 1);
  };

  const handleSave = () => {
    const versionToSave = changeVersion;
    saveJournal.mutate({
      assignment_id: journal.assignment.id,
      date: journal.date,
      entries: journal.students.map((row) => {
        const draft = drafts[row.student_id];
        return {
          student_id: row.student_id,
          grade_value: row.excused ? null : draft.grade,
          attendance: row.excused ? null : draft.attendance,
          comment: draft.comment.trim() === "" ? null : draft.comment.trim(),
        };
      }),
    }, { onSuccess: () => setSavedVersion(versionToSave) });
  };

  // Автосохранение: через секунду после последнего изменения. После ошибки ждём нажатия «Повторить».
  useEffect(() => {
    if (!canEdit || !isDirty || saveJournal.isPending || saveJournal.isError) {
      return;
    }
    const timer = setTimeout(handleSave, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // handleSave пересоздаётся каждый рендер; запуск зависит только от номера изменения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeVersion, canEdit, saveJournal.isPending, saveJournal.isError]);

  // Клавиатура: 2–5 — оценка и переход к следующему ученику, 0/Delete — убрать оценку, ↑/↓ — между учениками.
  const focusRow = (index: number) => {
    const row = document.querySelector<HTMLElement>(`[data-grade-row="${index}"] button:not(:disabled)`);
    row?.focus();
  };

  const handleGradeKeys = (event: KeyboardEvent<HTMLDivElement>, rowIndex: number, studentId: number) => {
    const grade = Number(event.key);
    if (GRADES.includes(grade)) {
      event.preventDefault();
      if (drafts[studentId].attendance !== "Ж") {
        updateDraft(studentId, { grade });
      }
      focusRow(rowIndex + 1);
    } else if (event.key === "0" || event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      updateDraft(studentId, { grade: null });
    } else if (event.key === "ArrowDown" || event.key === "Enter") {
      event.preventDefault();
      focusRow(rowIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(rowIndex - 1);
    }
  };

  const grades = journal.students
    .map((row) => drafts[row.student_id].grade)
    .filter((grade): grade is number => grade !== null);
  const average = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : null;
  const absentCount = journal.students.filter((row) => {
    const attendance = drafts[row.student_id].attendance;
    return attendance === "Ж" || attendance === "С";
  }).length;

  return (
    <>
      <div className={styles.summary}>
        <span>{t("studentsCount", { count: journal.students.length })}</span>
        <span>{t("gradesCount", { count: grades.length })}</span>
        <span>{average !== null ? t("average", { value: average.toFixed(1) }) : t("noGrades")}</span>
        <span>{t("absentCount", { count: absentCount })}</span>
      </div>

      {!journal.can_edit && <p className={adminStyles.notice}>{t("readOnly")}</p>}
      {journal.can_edit && isFutureDay && <p className={adminStyles.notice}>{t("futureDay")}</p>}
      {canEdit && <p className={styles.keyboardHint}>{t("keyboardHint")}</p>}

      <div className={adminStyles.tableWrap}>
        <table className={cn(adminStyles.table, adminStyles.responsiveTable)}>
          <thead>
            <tr>
              <th>№</th>
              <th>{t("student")}</th>
              <th>{t("grade")}</th>
              <th>{t("attendance")}</th>
              <th>{t("comment")}</th>
            </tr>
          </thead>
          <tbody>
            {journal.students.map((row, rowIndex) => {
              const draft = drafts[row.student_id];

              if (!canEdit || row.excused) {
                return (
                  <tr key={row.student_id}>
                    <td data-mobile-hidden className={adminStyles.cellMuted}>{row.number}</td>
                    <td data-label={t("student")}>{row.full_name}</td>
                    <td data-label={t("grade")}>
                      {draft.grade !== null ? (
                        <span className={cn(styles.grade, styles[`grade${draft.grade}`])}>{draft.grade}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td data-label={t("attendance")}>
                      {draft.attendance ? t(`attendanceCodes.${draft.attendance}`) : "—"}
                      {row.excused && <span className={styles.excused}>{t("excused")}</span>}
                    </td>
                    <td data-label={t("comment")} className={adminStyles.cellMuted}>{draft.comment || "—"}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.student_id}>
                  <td data-mobile-hidden className={adminStyles.cellMuted}>{row.number}</td>
                  <td data-label={t("student")}>{row.full_name}</td>
                  <td data-label={t("grade")}>
                    <div
                      className={styles.gradeButtons}
                      role="group"
                      aria-label={t("grade")}
                      data-grade-row={rowIndex}
                      onKeyDown={(event) => handleGradeKeys(event, rowIndex, row.student_id)}
                    >
                      {GRADES.map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          aria-pressed={draft.grade === grade}
                          disabled={draft.attendance === "Ж"}
                          className={cn(styles.gradeButton, draft.grade === grade && styles[`grade${grade}`])}
                          onClick={() =>
                            updateDraft(row.student_id, { grade: draft.grade === grade ? null : grade })
                          }
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td data-label={t("attendance")}>
                    <Select
                      size="sm"
                      className={styles.compactSelect}
                      ariaLabel={t("attendance")}
                      value={draft.attendance ?? ""}
                      onValueChange={(value) =>
                        updateDraft(row.student_id, {
                          attendance: value === "" ? null : (value as AttendanceCode),
                        })
                      }
                      options={[
                        { value: "", label: "—" },
                        ...EDITABLE_ATTENDANCE.map((code) => ({
                          value: code,
                          label: t(`attendanceCodes.${code}`),
                        })),
                      ]}
                    />
                  </td>
                  <td data-label={t("comment")}>
                    <input
                      className={styles.commentInput}
                      aria-label={t("comment")}
                      maxLength={500}
                      value={draft.comment}
                      onChange={(event) => updateDraft(row.student_id, { comment: event.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className={styles.footer}>
          {saveJournal.isError ? (
            <>
              <p className={adminStyles.formError} role="alert">
                <CircleAlert size={16} aria-hidden="true" />
                {handleApiError(saveJournal.error, tApiErrors)}
              </p>
              <button type="button" className={adminStyles.primaryButton} onClick={handleSave}>
                {t("retry")}
              </button>
            </>
          ) : (
            <p className={styles.saveStatus} role="status">
              {isDirty || saveJournal.isPending ? (
                <>
                  <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <CircleCheck size={16} aria-hidden="true" />
                  {t("autosaved")}
                </>
              )}
            </p>
          )}
        </div>
      )}
    </>
  );
}
