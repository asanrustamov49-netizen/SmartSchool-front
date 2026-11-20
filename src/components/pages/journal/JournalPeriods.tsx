"use client";

import { CircleAlert, CircleCheck, LoaderCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { PeriodGrades, PeriodKey } from "@/apis/journal.api";
import { useSavePeriodGrades } from "@/hooks/useJournal";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./journal.module.scss";

const GRADES = [5, 4, 3, 2];
const PERIOD_KEYS: PeriodKey[] = ["Q1", "Q2", "Q3", "Q4", "YEAR"];

type JournalPeriodsProps = {
  journal: PeriodGrades;
  today: string;
};

// Четвертные и годовые оценки. Учитель выбирает период, видит средний балл
// каждого ученика и ставит итоговую оценку; сохранение — одной кнопкой.
export function JournalPeriods({ journal, today }: JournalPeriodsProps) {
  const t = useTranslations("journal");
  const tApiErrors = useTranslations("apiErrors");
  const savePeriodGrades = useSavePeriodGrades();

  // Годовую оценку можно ставить с начала 4-й четверти, как и в backend.
  const periodStarts: Record<PeriodKey, string> = {
    Q1: "",
    Q2: "",
    Q3: "",
    Q4: "",
    YEAR: journal.periods.find((period) => period.key === "Q4")?.start ?? "",
  };
  for (const period of journal.periods) {
    periodStarts[period.key] = period.start;
  }
  const isStarted = (period: PeriodKey) => periodStarts[period] <= today;

  const [editingPeriod, setEditingPeriod] = useState<PeriodKey>(journal.current_period ?? "Q1");
  const [drafts, setDrafts] = useState<Record<number, number | null>>({});
  const isDirty = Object.keys(drafts).length > 0;
  const canEdit = journal.can_edit && isStarted(editingPeriod);

  // Несохранённые итоговые оценки не теряются при закрытии вкладки.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const getFinal = (studentId: number, period: PeriodKey) => {
    if (period === editingPeriod && studentId in drafts) {
      return drafts[studentId];
    }
    return journal.students.find((row) => row.student_id === studentId)?.grades[period].final ?? null;
  };

  const setDraft = (studentId: number, grade: number | null) => {
    setDrafts((current) => ({ ...current, [studentId]: grade }));
  };

  const changePeriod = (period: PeriodKey) => {
    setEditingPeriod(period);
    setDrafts({});
    savePeriodGrades.reset();
  };

  // Подсказка учителю: пустые итоговые оценки = округлённый средний балл.
  const fillFromAverage = () => {
    setDrafts((current) => {
      const next = { ...current };
      for (const row of journal.students) {
        const cell = row.grades[editingPeriod];
        if (getFinal(row.student_id, editingPeriod) === null && cell.average !== null) {
          next[row.student_id] = Math.min(5, Math.max(2, Math.round(cell.average)));
        }
      }
      return next;
    });
  };

  const handleSave = () => {
    savePeriodGrades.mutate(
      {
        assignment_id: journal.assignment.id,
        period: editingPeriod,
        entries: Object.entries(drafts).map(([studentId, grade]) => ({
          student_id: Number(studentId),
          grade_value: grade,
        })),
      },
      { onSuccess: () => setDrafts({}) },
    );
  };

  return (
    <>
      <p className={adminStyles.notice}>{journal.can_edit ? t("periodsHint") : t("periodsReadOnly")}</p>

      {journal.can_edit && (
        <div className={styles.periodToolbar}>
          <div className={styles.tabs} role="tablist" aria-label={t("editingPeriod")}>
            {PERIOD_KEYS.map((period) => (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={editingPeriod === period}
                disabled={!isStarted(period)}
                title={isStarted(period) ? undefined : t("notStarted")}
                className={cn(styles.tab, editingPeriod === period && styles.tabActive)}
                onClick={() => changePeriod(period)}
              >
                {t(`periodNames.${period}`)}
                {journal.current_period === period && <small> · {t("currentPeriod")}</small>}
              </button>
            ))}
          </div>
          {canEdit && (
            <button type="button" className={adminStyles.secondaryButton} onClick={fillFromAverage}>
              <Sparkles size={16} aria-hidden="true" />
              {t("fillFromAverage")}
            </button>
          )}
        </div>
      )}

      <div className={styles.monthWrap}>
        <table className={cn(styles.monthTable, styles.periodsTable)}>
          <thead>
            <tr>
              <th className={styles.stickyNumber}>№</th>
              <th className={styles.stickyName}>{t("student")}</th>
              {PERIOD_KEYS.map((period) => (
                <th
                  key={period}
                  className={cn(
                    styles.periodHeader,
                    journal.can_edit && period === editingPeriod && styles.periodEditing,
                    period === "YEAR" && styles.yearColumn,
                  )}
                >
                  {t(`periodNames.${period}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {journal.students.map((row) => (
              <tr key={row.student_id}>
                <td className={styles.stickyNumber}>{row.number}</td>
                <td className={styles.stickyName} title={row.full_name}>
                  {row.full_name}
                </td>
                {PERIOD_KEYS.map((period) => {
                  const cell = row.grades[period];
                  const final = getFinal(row.student_id, period);
                  const isEditing = canEdit && period === editingPeriod;
                  return (
                    <td
                      key={period}
                      className={cn(
                        styles.periodCell,
                        journal.can_edit && period === editingPeriod && styles.periodEditing,
                        period === "YEAR" && styles.yearColumn,
                      )}
                    >
                      {isEditing ? (
                        <div className={styles.gradeButtons} role="group" aria-label={t(`periodNames.${period}`)}>
                          {GRADES.map((grade) => (
                            <button
                              key={grade}
                              type="button"
                              aria-pressed={final === grade}
                              className={cn(styles.gradeButton, final === grade && styles[`grade${grade}`])}
                              onClick={() => setDraft(row.student_id, final === grade ? null : grade)}
                            >
                              {grade}
                            </button>
                          ))}
                        </div>
                      ) : final !== null ? (
                        <span className={cn(styles.grade, styles[`grade${final}`])}>{final}</span>
                      ) : (
                        <span className={styles.emptyGrade}>—</span>
                      )}
                      {cell.average !== null && (
                        <small className={styles.averageHint}>
                          {t("averageHint", { value: cell.average.toFixed(1) })}
                        </small>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className={styles.footer}>
          {savePeriodGrades.isError && (
            <p className={adminStyles.formError} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              {handleApiError(savePeriodGrades.error, tApiErrors)}
            </p>
          )}
          <p className={styles.saveStatus} role="status">
            {isDirty ? (
              t("unsaved")
            ) : (
              <>
                <CircleCheck size={16} aria-hidden="true" />
                {t("saved")}
              </>
            )}
          </p>
          <button
            type="button"
            className={adminStyles.primaryButton}
            disabled={!isDirty || savePeriodGrades.isPending}
            onClick={handleSave}
          >
            {savePeriodGrades.isPending && <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />}
            {t("save")}
          </button>
        </div>
      )}
    </>
  );
}
