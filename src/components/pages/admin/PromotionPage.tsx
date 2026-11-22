"use client";

import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  CircleCheck,
  GraduationCap,
  History,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  getNextAcademicYear,
  type PromotionReviewStudent,
  type PromotionStudent,
} from "@/apis/promotion.api";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import { useClasses } from "@/hooks/useClasses";
import {
  useExecutePromotion,
  useMoveStudent,
  usePromotionPreview,
  usePromotionReview,
} from "@/hooks/usePromotion";
import { getApiErrorStatus, handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import styles from "./admin.module.scss";
import promotionStyles from "./promotion.module.scss";

// Если классов немного, они раскрыты сразу; в большой школе — свёрнуты, чтобы список не был бесконечным.
const OPEN_GROUPS_LIMIT = 6;
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

type StudentStatus = "promoted" | "repeated" | "graduated" | "changed";

function getStudentStatus(student: PromotionReviewStudent): StudentStatus {
  if (student.to_grade === null) {
    return "graduated";
  }
  if (student.to_grade === student.from_grade + 1) {
    return "promoted";
  }
  if (student.to_grade === student.from_grade) {
    return "repeated";
  }
  return "changed";
}

function sortClassNames(first: string, second: string) {
  return first.localeCompare(second, undefined, { numeric: true });
}

// Ученики по классам нового года; выпускники — отдельной группой в конце.
function groupByNewClass(students: PromotionReviewStudent[]) {
  const groups = new Map<string, PromotionReviewStudent[]>();
  for (const student of students) {
    const key = student.to_class ?? "";
    groups.set(key, [...(groups.get(key) ?? []), student]);
  }
  return [...groups.entries()].sort(([first], [second]) => {
    if (first === "") return 1;
    if (second === "") return -1;
    return sortClassNames(first, second);
  });
}

// Короткая сводка «5-А → 6-А · 24 уч.» до перевода.
function groupPreview(students: PromotionStudent[]) {
  const groups = new Map<string, { nextClass: string | null; count: number }>();
  for (const student of students) {
    const group = groups.get(student.current_class) ?? { nextClass: student.next_class, count: 0 };
    group.count += 1;
    groups.set(student.current_class, group);
  }
  return [...groups.entries()].sort(([first], [second]) => sortClassNames(first, second));
}

// Перевод учеников на следующий учебный год в два шага:
// 1) все ученики переводятся автоматически одной кнопкой;
// 2) директор или завуч просматривает результат и меняет класс отдельным ученикам
//    (оставить на второй год, перевести в другую букву, оставить выпускника в 11 классе).
export function PromotionPage() {
  const t = useTranslations("promotion");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const classesQuery = useClasses();
  const years = [...new Set((classesQuery.data ?? []).map((schoolClass) => schoolClass.academic_year))].sort(
    (first, second) => second.localeCompare(first),
  );
  const [selectedYear, setSelectedYear] = useState("");
  // Если в самый новый год уже переводили, страница открывается на итогах этого перевода,
  // чтобы можно было поправить классы, а не на кнопке следующего перевода.
  const latestReviewQuery = usePromotionReview(years.length > 1 ? years[0] : null);
  const latestPromotionDone = (latestReviewQuery.data?.students.length ?? 0) > 0;
  const defaultYear = latestPromotionDone ? years[1] : years[0];
  const sourceYear = selectedYear || defaultYear || "";
  const targetYear = getNextAcademicYear(sourceYear);

  const reviewQuery = usePromotionReview(sourceYear ? targetYear : null);
  const reviewStudents = reviewQuery.data?.students ?? [];
  const isDone = reviewStudents.length > 0;
  const previewQuery = usePromotionPreview(sourceYear, targetYear, reviewQuery.isSuccess && !isDone);
  const executeMutation = useExecutePromotion();
  const moveMutation = useMoveStudent();
  const [confirming, setConfirming] = useState(false);
  const [search, setSearch] = useState("");

  // Буквы классов школы: из них составляется список классов для перевода ученика.
  const letters = [
    ...new Set([
      ...(classesQuery.data ?? []).map((schoolClass) => schoolClass.letter),
      ...reviewStudents.flatMap((student) => (student.to_letter ? [student.to_letter] : [])),
    ]),
  ].sort((first, second) => first.localeCompare(second));
  const classOptions = GRADES.flatMap((grade) =>
    letters.map((letter) => ({ value: `${grade}|${letter}`, label: `${grade}-${letter}` })),
  );

  const changeYear = (year: string) => {
    setSelectedYear(year);
    setSearch("");
    setConfirming(false);
  };

  const handleExecute = () => {
    if (!targetYear) {
      return;
    }
    executeMutation.mutate(
      { source_academic_year: sourceYear, target_academic_year: targetYear },
      {
        onSuccess: () => {
          setConfirming(false);
          // После перевода появляется новый год; страница остаётся на итогах этого перевода.
          setSelectedYear(sourceYear);
        },
      },
    );
  };

  const handleMove = (student: PromotionReviewStudent, value: string) => {
    const [grade, letter] = value.split("|");
    if (!targetYear || !grade || !letter) {
      return;
    }
    moveMutation.mutate({
      student_id: student.student_id,
      target_academic_year: targetYear,
      grade_number: Number(grade),
      letter,
    });
  };

  const renderPreview = () => {
    if (previewQuery.isPending && previewQuery.fetchStatus !== "idle") {
      return <DataState status="loading" />;
    }

    if (previewQuery.isError) {
      // 404 — в выбранном году нет активных учеников.
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
    const graduating = students.filter((student) => student.will_graduate).length;

    return (
      <>
        <div className={promotionStyles.summary}>
          <span>
            <TrendingUp size={18} aria-hidden="true" />
            <strong>{students.length - graduating}</strong>
            {t("promoted")}
          </span>
          <span>
            <GraduationCap size={18} aria-hidden="true" />
            <strong>{graduating}</strong>
            {t("graduated")}
          </span>
        </div>

        <ul className={promotionStyles.chips}>
          {groupPreview(students).map(([className, group]) => (
            <li key={className}>
              <strong>{className}</strong>
              <ArrowRight size={14} aria-hidden="true" />
              <span className={cn(!group.nextClass && promotionStyles.graduate)}>
                {group.nextClass ?? t("graduation")}
              </span>
              <small>{t("studentsCount", { count: group.count })}</small>
            </li>
          ))}
        </ul>

        <p className={styles.fieldHint}>{t("autoHint")}</p>

        {executeMutation.isError && (
          <p className={styles.formError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {handleApiError(executeMutation.error, tApiErrors)}
          </p>
        )}

        {confirming ? (
          <div className={styles.inlineConfirm} role="alertdialog" aria-labelledby="promotion-confirm">
            <p id="promotion-confirm" className={styles.notice}>
              {t("confirm", { source: sourceYear, target: targetYear ?? "" })}
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

  const renderReview = () => {
    const counts = { promoted: 0, repeated: 0, graduated: 0, changed: 0 };
    for (const student of reviewStudents) {
      counts[getStudentStatus(student)] += 1;
    }
    const searchText = search.trim().toLowerCase();
    const visibleStudents = reviewStudents.filter((student) =>
      student.full_name.toLowerCase().includes(searchText),
    );
    const groups = groupByNewClass(visibleStudents);

    return (
      <>
        <p className={styles.notice} role="status">
          <CircleCheck size={16} aria-hidden="true" />
          {t("doneNotice", { target: targetYear ?? "" })}
        </p>

        <div className={promotionStyles.summary}>
          <span>
            <TrendingUp size={18} aria-hidden="true" />
            <strong>{counts.promoted}</strong>
            {t("statusCount.promoted")}
          </span>
          <span>
            <GraduationCap size={18} aria-hidden="true" />
            <strong>{counts.graduated}</strong>
            {t("statusCount.graduated")}
          </span>
          <span>
            <RotateCcw size={18} aria-hidden="true" />
            <strong>{counts.repeated + counts.changed}</strong>
            {t("statusCount.changed")}
          </span>
        </div>

        <p className={styles.fieldHint}>
          <PencilLine size={14} aria-hidden="true" /> {t("reviewHint")}
        </p>

        {moveMutation.isError && (
          <p className={styles.formError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {handleApiError(moveMutation.error, tApiErrors)}
          </p>
        )}

        <label className={promotionStyles.search}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            className={styles.input}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        {groups.length === 0 ? (
          <DataState status="empty" message={t("noMatches")} />
        ) : (
          <div className={promotionStyles.groups}>
            {groups.map(([className, students]) => (
              <details
                key={className || "graduates"}
                className={promotionStyles.group}
                open={searchText !== "" || groups.length <= OPEN_GROUPS_LIMIT}
              >
                <summary>
                  <span className={cn(promotionStyles.groupTitle, !className && promotionStyles.graduate)}>
                    {className || t("graduation")}
                  </span>
                  <span className={promotionStyles.groupMeta}>{t("studentsCount", { count: students.length })}</span>
                  <ChevronDown className={promotionStyles.chevron} size={18} aria-hidden="true" />
                </summary>

                <ul>
                  {students.map((student) => {
                    const status = getStudentStatus(student);
                    const isMoving = moveMutation.isPending && moveMutation.variables?.student_id === student.student_id;
                    return (
                      <li key={student.student_id} className={promotionStyles.studentRow}>
                        <span className={promotionStyles.studentName}>
                          <strong>{student.full_name}</strong>
                          <small>
                            {t("wasIn", { name: student.from_class })}
                            {/* Обычный перевод и выпуск видны по группе, значок — только для ручных изменений. */}
                            {(status === "repeated" || status === "changed") && (
                              <span className={promotionStyles.badge}>{t(`status.${status}`)}</span>
                            )}
                          </small>
                        </span>
                        <Select
                          size="sm"
                          className={promotionStyles.moveSelect}
                          ariaLabel={t("moveLabel", { name: student.full_name })}
                          value={student.to_grade ? `${student.to_grade}|${student.to_letter}` : ""}
                          placeholder={t("graduation")}
                          disabled={isMoving}
                          onValueChange={(value) => handleMove(student, value)}
                          options={classOptions}
                        />
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    const isLoadingReview =
      (reviewQuery.isPending && reviewQuery.fetchStatus !== "idle") ||
      (latestReviewQuery.isPending && latestReviewQuery.fetchStatus !== "idle");
    if (classesQuery.isPending || isLoadingReview) {
      return <DataState status="loading" />;
    }

    if (years.length === 0) {
      return <DataState status="empty" message={t("noClasses")} action={{ label: t("goToClasses"), href: "/admin/classes" }} />;
    }

    if (reviewQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(reviewQuery.error, tApiErrors)}
          onRetry={() => reviewQuery.refetch()}
        />
      );
    }

    return isDone ? renderReview() : renderPreview();
  };

  // Быстрый переход между итогами прошлого перевода (предыдущий год → самый новый)
  // и следующим переводом (самый новый год → дальше).
  const newestYear = years[0];
  const previousYear = years[1];
  const canShowPreviousResult = !isDone && previousYear !== undefined && sourceYear === newestYear;
  const canStartNext = isDone && newestYear !== undefined && sourceYear !== newestYear;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

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
          {canShowPreviousResult && (
            <button type="button" className={styles.secondaryButton} onClick={() => changeYear(previousYear)}>
              <History size={16} aria-hidden="true" />
              {t("showPrevious", { source: previousYear, target: newestYear })}
            </button>
          )}
          {canStartNext && (
            <button type="button" className={styles.secondaryButton} onClick={() => changeYear(newestYear)}>
              <TrendingUp size={16} aria-hidden="true" />
              {t("showNext", { source: newestYear, target: getNextAcademicYear(newestYear) ?? "" })}
            </button>
          )}
        </div>
        {!isDone && <p className={styles.notice}>{t("rules")}</p>}
        {renderContent()}
      </section>
    </div>
  );
}
