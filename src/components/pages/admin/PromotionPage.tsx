"use client";

import { AlertCircle, ArrowRight, CircleCheck, GraduationCap, LoaderCircle, RotateCcw, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getNextAcademicYear, type PromotionResult, type PromotionStudent } from "@/apis/promotion.api";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import { useClasses } from "@/hooks/useClasses";
import { useExecutePromotion, usePromotionPreview } from "@/hooks/usePromotion";
import { getApiErrorStatus, handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import styles from "./admin.module.scss";
import promotionStyles from "./promotion.module.scss";

type ClassGroup = { name: string; nextClass: string | null; students: PromotionStudent[] };

function groupByClass(students: PromotionStudent[]): ClassGroup[] {
  const groups = new Map<string, ClassGroup>();
  for (const student of students) {
    const group = groups.get(student.current_class) ?? {
      name: student.current_class,
      nextClass: student.next_class,
      students: [],
    };
    group.students.push(student);
    groups.set(student.current_class, group);
  }
  return [...groups.values()];
}

// Перевод учеников на следующий учебный год. Backend переводит всех активных учеников
// выбранного года в класс с той же буквой на параллель выше и выпускает 11-классников.
// Отмеченные ученики остаются в своей параллели (на второй год).
export function PromotionPage() {
  const t = useTranslations("promotion");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const classesQuery = useClasses();
  const years = [...new Set((classesQuery.data ?? []).map((schoolClass) => schoolClass.academic_year))].sort(
    (first, second) => second.localeCompare(first),
  );
  const [selectedYear, setSelectedYear] = useState("");
  const sourceYear = selectedYear || years[0] || "";
  const targetYear = getNextAcademicYear(sourceYear);
  const previewQuery = usePromotionPreview(sourceYear, targetYear);
  const executeMutation = useExecutePromotion();
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PromotionResult | null>(null);

  const toggleExcluded = (studentId: number) => {
    setExcludedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const changeYear = (year: string) => {
    setSelectedYear(year);
    setExcludedIds(new Set());
    setConfirming(false);
    setResult(null);
  };

  const handleExecute = () => {
    if (!targetYear) {
      return;
    }
    executeMutation.mutate(
      {
        source_academic_year: sourceYear,
        target_academic_year: targetYear,
        excluded_student_ids: [...excludedIds],
      },
      {
        onSuccess: (promotionResult) => {
          setConfirming(false);
          setExcludedIds(new Set());
          setResult(promotionResult);
        },
      },
    );
  };

  const renderPreview = () => {
    if (classesQuery.isPending || (previewQuery.isPending && previewQuery.fetchStatus !== "idle")) {
      return <DataState status="loading" />;
    }

    if (years.length === 0) {
      return <DataState status="empty" message={t("noClasses")} />;
    }

    if (previewQuery.isError) {
      // 404 — в выбранном году нет активных учеников (например, перевод уже выполнен).
      if (getApiErrorStatus(previewQuery.error) === 404) {
        return <DataState status="empty" message={t("noStudents", { year: sourceYear })} />;
      }
      return (
        <DataState
          status="error"
          message={handleApiError(previewQuery.error, tApiErrors)}
          onRetry={() => previewQuery.refetch()}
        />
      );
    }

    if (!previewQuery.data) {
      return null;
    }

    const students = previewQuery.data.students;
    const repeating = students.filter((student) => excludedIds.has(student.student_id)).length;
    const graduating = students.filter(
      (student) => student.will_graduate && !excludedIds.has(student.student_id),
    ).length;
    const promoted = students.length - repeating - graduating;

    return (
      <>
        <div className={promotionStyles.summary}>
          <span>
            <TrendingUp size={18} aria-hidden="true" />
            <strong>{promoted}</strong>
            {t("promoted")}
          </span>
          <span>
            <GraduationCap size={18} aria-hidden="true" />
            <strong>{graduating}</strong>
            {t("graduated")}
          </span>
          <span>
            <RotateCcw size={18} aria-hidden="true" />
            <strong>{repeating}</strong>
            {t("repeated")}
          </span>
        </div>

        <p className={styles.fieldHint}>{t("excludeHint")}</p>

        <div className={promotionStyles.groups}>
          {groupByClass(students).map((group) => (
            <section key={group.name} className={promotionStyles.group}>
              <h3>
                <span>{group.name}</span>
                <ArrowRight size={16} aria-hidden="true" />
                <span className={cn(!group.nextClass && promotionStyles.graduate)}>
                  {group.nextClass ?? t("graduation")}
                </span>
              </h3>
              <ul>
                {group.students.map((student) => {
                  const excluded = excludedIds.has(student.student_id);
                  return (
                    <li key={student.student_id} className={cn(excluded && promotionStyles.excluded)}>
                      <label>
                        <input
                          type="checkbox"
                          checked={excluded}
                          onChange={() => toggleExcluded(student.student_id)}
                        />
                        <span>{student.full_name}</span>
                      </label>
                      {excluded && <span className={promotionStyles.badge}>{t("stays")}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {executeMutation.isError && (
          <p className={styles.formError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {handleApiError(executeMutation.error, tApiErrors)}
          </p>
        )}

        {confirming ? (
          <div className={styles.inlineConfirm} role="alertdialog" aria-labelledby="promotion-confirm">
            <p id="promotion-confirm" className={styles.notice}>
              {t("confirm", { source: sourceYear, target: targetYear ?? "", promoted, graduating, repeating })}
            </p>
            <div className={styles.formActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setConfirming(false)}>
                {tForm("cancel")}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={executeMutation.isPending}
                onClick={handleExecute}
              >
                {executeMutation.isPending && <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />}
                {t("execute")}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.formActions}>
            <button type="button" className={styles.primaryButton} onClick={() => setConfirming(true)}>
              <TrendingUp size={16} aria-hidden="true" />
              {t("start", { target: targetYear ?? "" })}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

      {result && (
        <p className={styles.notice} role="status">
          <CircleCheck size={16} aria-hidden="true" />
          {t("done", { promoted: result.promoted, graduated: result.graduated, repeated: result.repeated })}
        </p>
      )}

      <section className={styles.card}>
        <div className={promotionStyles.years}>
          <div className={styles.field}>
            <label htmlFor="promotion-source">{t("sourceYear")}</label>
            <Select
              id="promotion-source"
              value={sourceYear}
              onValueChange={changeYear}
              options={years.map((year) => ({ value: year, label: year }))}
            />
          </div>
          <ArrowRight className={promotionStyles.yearArrow} size={20} aria-hidden="true" />
          <div className={styles.field}>
            <span>{t("targetYear")}</span>
            <strong className={promotionStyles.targetYear}>{targetYear ?? "—"}</strong>
          </div>
        </div>
        <p className={styles.notice}>{t("rules")}</p>
        {renderPreview()}
      </section>
    </div>
  );
}
