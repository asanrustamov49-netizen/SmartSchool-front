"use client";

import { CircleAlert, Medal, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { OlympiadTopStudent } from "@/apis/olympiad.api";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import {
  useAddOlympiadCandidate,
  useApproveOlympiadCandidate,
  useAutoSelectOlympiad,
  useOlympiadAnalytics,
} from "@/hooks/useOlympiad";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { OlympiadCandidates } from "./OlympiadCandidates";
import adminStyles from "../admin/admin.module.scss";
import styles from "./olympiad.module.scss";

// Сколько лучших учеников backend отбирает по умолчанию (OLYMPIAD_TOP_N).
const AUTO_SELECT_LIMIT = 3;
const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

// Раздел директора и завуча: backend считает топ по XP каждого предмета,
// администрация включает учеников в олимпиадный состав вручную или автоматически.
export function OlympiadPage() {
  const t = useTranslations("olympiad");
  const tApiErrors = useTranslations("apiErrors");
  const [gradeNumber, setGradeNumber] = useState<number | null>(null);
  const analyticsQuery = useOlympiadAnalytics(gradeNumber);
  const addCandidate = useAddOlympiadCandidate();
  const approveCandidate = useApproveOlympiadCandidate();
  const autoSelect = useAutoSelectOlympiad();
  const isBusy = addCandidate.isPending || approveCandidate.isPending || autoSelect.isPending;
  const actionError = addCandidate.error ?? approveCandidate.error ?? autoSelect.error;

  const renderAction = (subjectId: number, student: OlympiadTopStudent) => {
    if (student.candidate_status === "SELECTED") {
      return <span className={cn(styles.badge, styles.badgeSelected)}>{t("selected")}</span>;
    }

    if (student.candidate_status === "SUGGESTED" && student.candidate_id !== null) {
      const candidateId = student.candidate_id;
      return (
        <button
          type="button"
          className={adminStyles.linkButton}
          disabled={isBusy}
          onClick={() => approveCandidate.mutate(candidateId)}
        >
          {t("approve")}
        </button>
      );
    }

    return (
      <button
        type="button"
        className={adminStyles.linkButton}
        disabled={isBusy}
        onClick={() => addCandidate.mutate({ subject_id: subjectId, student_id: student.student_id })}
      >
        {t("add")}
      </button>
    );
  };

  const renderAnalytics = () => {
    if (analyticsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (analyticsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(analyticsQuery.error, tApiErrors)}
          onRetry={() => analyticsQuery.refetch()}
        />
      );
    }

    if (analyticsQuery.data.subjects.length === 0) {
      return <DataState status="empty" message={t("noSubjects")} />;
    }

    return (
      <div className={styles.grid}>
        {analyticsQuery.data.subjects.map((subject) => (
          <article key={subject.subject_id} className={styles.subject}>
            <header className={styles.subjectHeader}>
              <h3>{subject.subject_name}</h3>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                disabled={isBusy || subject.top.length === 0}
                onClick={() =>
                  autoSelect.mutate({
                    subject_id: subject.subject_id,
                    grade_number: gradeNumber,
                    limit: AUTO_SELECT_LIMIT,
                  })
                }
              >
                <Sparkles size={15} aria-hidden="true" />
                {t("autoSelect", { count: AUTO_SELECT_LIMIT })}
              </button>
            </header>

            {subject.top.length === 0 ? (
              <p className={styles.empty}>{t("noXp")}</p>
            ) : (
              <ol className={styles.top}>
                {subject.top.map((student) => (
                  <li key={student.student_id}>
                    <span className={cn(styles.rank, student.rank <= 3 && styles[`rank${student.rank}`])}>
                      {student.rank}
                    </span>
                    <span className={styles.name}>
                      <strong>{student.full_name}</strong>
                      <small>
                        {student.class_name} · {t("xp", { count: student.xp })}
                      </small>
                    </span>
                    {renderAction(subject.subject_id, student)}
                  </li>
                ))}
              </ol>
            )}
          </article>
        ))}
      </div>
    );
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
        <div className={styles.sectionHeader}>
          <h2 className={adminStyles.cardTitle}>
            <Medal size={18} aria-hidden="true" />
            {t("topTitle")}
          </h2>
          <Select
            className={styles.gradeSelect}
            ariaLabel={t("grade")}
            value={gradeNumber === null ? "" : String(gradeNumber)}
            onValueChange={(value) => setGradeNumber(value === "" ? null : Number(value))}
            options={[
              { value: "", label: t("allGrades") },
              ...GRADES.map((grade) => ({ value: String(grade), label: t("gradeOption", { grade }) })),
            ]}
          />
        </div>

        {actionError && (
          <p className={adminStyles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {handleApiError(actionError, tApiErrors)}
          </p>
        )}

        {renderAnalytics()}
      </section>

      <OlympiadCandidates />
    </div>
  );
}
