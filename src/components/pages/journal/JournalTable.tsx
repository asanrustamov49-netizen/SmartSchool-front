"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AttendanceCode, JournalDay, JournalRow } from "@/apis/journal.api";
import { useSaveJournalDay } from "@/hooks/useJournal";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./journal.module.scss";

const GRADES = [5, 4, 3, 2];
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
  const [isDirty, setIsDirty] = useState(false);

  const updateDraft = (studentId: number, change: Partial<DraftRow>) => {
    setDrafts((current) => {
      const next = { ...current[studentId], ...change };
      // Отсутствующему без причины backend не разрешает ставить оценку.
      if (next.attendance === "Ж") {
        next.grade = null;
      }
      return { ...current, [studentId]: next };
    });
    setIsDirty(true);
  };

  const handleSave = () => {
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
    }, { onSuccess: () => setIsDirty(false) });
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

      <div className={adminStyles.tableWrap}>
        <table className={adminStyles.table}>
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
            {journal.students.map((row) => {
              const draft = drafts[row.student_id];

              if (!canEdit || row.excused) {
                return (
                  <tr key={row.student_id}>
                    <td className={adminStyles.cellMuted}>{row.number}</td>
                    <td>{row.full_name}</td>
                    <td>
                      {draft.grade !== null ? (
                        <span className={cn(styles.grade, styles[`grade${draft.grade}`])}>{draft.grade}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {draft.attendance ? t(`attendanceCodes.${draft.attendance}`) : "—"}
                      {row.excused && <span className={styles.excused}>{t("excused")}</span>}
                    </td>
                    <td className={adminStyles.cellMuted}>{draft.comment || "—"}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.student_id}>
                  <td className={adminStyles.cellMuted}>{row.number}</td>
                  <td>{row.full_name}</td>
                  <td>
                    <div className={styles.gradeButtons} role="group" aria-label={t("grade")}>
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
                  <td>
                    <select
                      className={styles.compactSelect}
                      aria-label={t("attendance")}
                      value={draft.attendance ?? ""}
                      onChange={(event) =>
                        updateDraft(row.student_id, {
                          attendance: event.target.value === "" ? null : (event.target.value as AttendanceCode),
                        })
                      }
                    >
                      <option value="">—</option>
                      {EDITABLE_ATTENDANCE.map((code) => (
                        <option key={code} value={code}>
                          {t(`attendanceCodes.${code}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
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
          {saveJournal.isError && (
            <p className={adminStyles.formError} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              {handleApiError(saveJournal.error, tApiErrors)}
            </p>
          )}
          {saveJournal.isSuccess && !isDirty && (
            <p className={adminStyles.notice} role="status">
              <CircleCheck size={16} aria-hidden="true" />
              {t("saved")}
            </p>
          )}
          <button
            type="button"
            className={adminStyles.primaryButton}
            disabled={!isDirty || saveJournal.isPending}
            onClick={handleSave}
          >
            {saveJournal.isPending && (
              <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
            )}
            {t("save")}
          </button>
        </div>
      )}
    </>
  );
}
