"use client";

import { BookOpen, CircleCheck, Layers, LoaderCircle, RefreshCw, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { getClassName, type SchoolClass } from "@/apis/classes.api";
import type { RatingItem, RatingScope } from "@/apis/ratings.api";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import { useCurrentUser } from "@/hooks/useAuth";
import { useClasses } from "@/hooks/useClasses";
import { useRating, useRecomputeRatings } from "@/hooks/useRatings";
import { useSubjects } from "@/hooks/useSubjects";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./ratings.module.scss";

const RATING_LIMIT = 100;

type ClassOption = { id: number; name: string; grade: number | null };

// Номер параллели из названия класса «11-А» → 11.
function gradeFromName(name: string | null) {
  const grade = Number.parseInt(name ?? "", 10);
  return Number.isNaN(grade) ? null : grade;
}

function isAdmin(user: CurrentUser) {
  return user.role === "DIRECTOR" || user.role === "DEPUTY";
}

// Классы, рейтинг которых показывается вкладками:
// директор и завуч — все классы школы, учитель — классы, где ведёт уроки или руководит,
// ученик — свой класс, родитель — классы детей.
function getClassOptions(user: CurrentUser, schoolClasses: SchoolClass[]): ClassOption[] {
  const options: ClassOption[] = [];

  const addOption = (id: number | null, name: string | null, grade: number | null) => {
    if (id !== null && !options.some((option) => option.id === id)) {
      options.push({ id, name: name ?? "—", grade: grade ?? gradeFromName(name) });
    }
  };

  if (isAdmin(user)) {
    for (const schoolClass of schoolClasses) {
      addOption(schoolClass.id, getClassName(schoolClass), schoolClass.grade_number);
    }
    return options;
  }

  for (const schoolClass of user.classes_led ?? []) {
    addOption(schoolClass.id, schoolClass.name, null);
  }
  for (const assignment of user.assignments ?? []) {
    addOption(assignment.class_id, assignment.class_name, null);
  }
  if (user.student) {
    addOption(user.student.class_id, user.student.class_name, user.student.grade_number ?? null);
  }
  for (const child of user.children ?? []) {
    addOption(child.class_id, child.class_name, null);
  }

  return options.sort((first, second) => first.name.localeCompare(second.name, "ru"));
}

function getOwnStudentIds(user: CurrentUser) {
  const ids = new Set<number>();

  if (user.student) {
    ids.add(user.student.student_id);
  }

  for (const child of user.children ?? []) {
    ids.add(child.id);
  }

  return ids;
}

function scopeKey(scope: RatingScope) {
  if (scope.kind === "class") {
    return `class-${scope.classId}`;
  }
  if (scope.kind === "parallel") {
    return `parallel-${scope.grade}`;
  }
  return "school";
}

export function RatingsPage() {
  const t = useTranslations("ratings");
  const tApiErrors = useTranslations("apiErrors");
  const user = useCurrentUser().data;
  const classesQuery = useClasses(user ? isAdmin(user) : false);
  const subjectsQuery = useSubjects();
  const [scope, setScope] = useState<RatingScope>({ kind: "school" });
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const ratingQuery = useRating(scope, subjectId, RATING_LIMIT);
  const recompute = useRecomputeRatings();

  // Список всех классов нужен только директору и завучу; остальным он может быть недоступен.
  const schoolClasses = user && isAdmin(user) ? (classesQuery.data ?? []) : [];
  const classOptions = user ? getClassOptions(user, schoolClasses) : [];
  const grades = [...new Set(classOptions.map((option) => option.grade).filter((grade) => grade !== null))].sort(
    (first, second) => (first ?? 0) - (second ?? 0),
  );
  const ownStudentIds = user ? getOwnStudentIds(user) : new Set<number>();
  const subjects = subjectsQuery.data ?? [];
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);

  const scopeTabs: { scope: RatingScope; label: string; icon?: typeof Trophy }[] = [
    { scope: { kind: "school" }, label: t("school"), icon: Trophy },
    ...grades.map((grade) => ({
      scope: { kind: "parallel" as const, grade: grade ?? 0 },
      label: t("parallel", { grade: grade ?? 0 }),
      icon: Layers,
    })),
    ...classOptions.map((option) => ({
      scope: { kind: "class" as const, classId: option.id },
      label: t("class", { name: option.name }),
    })),
  ];

  const renderRows = (items: RatingItem[]) => {
    const maxXp = Math.max(...items.map((item) => item.xp), 1);

    return (
      <ol className={styles.list}>
        {items.map((item) => (
          <li
            key={item.student_id}
            className={cn(styles.row, ownStudentIds.has(item.student_id) && styles.rowOwn)}
          >
            <span className={cn(styles.rank, item.rank <= 3 && styles[`rank${item.rank}`])}>
              {item.rank}
            </span>
            <span className={styles.name}>
              <strong>{item.full_name}</strong>
              {item.class_name && <small>{item.class_name}</small>}
            </span>
            <span className={styles.bar} aria-hidden="true">
              <span style={{ width: `${(item.xp / maxXp) * 100}%` }} />
            </span>
            <span className={styles.xp}>{t("xp", { count: item.xp })}</span>
          </li>
        ))}
      </ol>
    );
  };

  const renderContent = () => {
    if (ratingQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (ratingQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(ratingQuery.error, tApiErrors)}
          onRetry={() => ratingQuery.refetch()}
        />
      );
    }

    // Ученики без XP по выбранному предмету в рейтинге предмета не нужны.
    const items = subjectId === null ? ratingQuery.data.items : ratingQuery.data.items.filter((item) => item.xp > 0);

    if (items.length === 0) {
      return (
        <DataState
          status="empty"
          message={selectedSubject ? t("emptySubject", { subject: selectedSubject.name }) : t("empty")}
        />
      );
    }

    return renderRows(items);
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        {/* Пересчёт XP по всему журналу — для директора и завуча (POST /ratings/recompute). */}
        {user && isAdmin(user) && (
          <button
            type="button"
            className={adminStyles.secondaryButton}
            disabled={recompute.isPending}
            onClick={() => recompute.mutate()}
          >
            {recompute.isPending ? (
              <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
            ) : (
              <RefreshCw size={16} aria-hidden="true" />
            )}
            {t("recompute")}
          </button>
        )}
      </header>

      {recompute.isSuccess && (
        <p className={adminStyles.notice} role="status">
          <CircleCheck size={16} aria-hidden="true" />
          {t("recomputed", { count: recompute.data.recomputed })}
        </p>
      )}
      {recompute.isError && (
        <p className={adminStyles.formError} role="alert">
          {handleApiError(recompute.error, tApiErrors)}
        </p>
      )}

      <section className={adminStyles.card}>
        <div className={styles.controls}>
          <div className={styles.tabs} role="tablist" aria-label={t("scope")}>
            {scopeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = scopeKey(tab.scope) === scopeKey(scope);
              return (
                <button
                  key={scopeKey(tab.scope)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn(styles.tab, isActive && styles.tabActive)}
                  onClick={() => setScope(tab.scope)}
                >
                  {Icon && <Icon size={15} aria-hidden="true" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Select
            className={styles.subjectSelect}
            icon={<BookOpen size={16} aria-hidden="true" />}
            ariaLabel={t("subject")}
            value={subjectId === null ? "" : String(subjectId)}
            onValueChange={(value) => setSubjectId(value === "" ? null : Number(value))}
            options={[
              { value: "", label: t("allSubjects") },
              ...subjects.map((subject) => ({ value: String(subject.id), label: subject.name })),
            ]}
          />
        </div>

        <p className={styles.caption}>
          {selectedSubject ? t("captionSubject", { subject: selectedSubject.name }) : t("captionAll")}
        </p>

        {renderContent()}
      </section>
    </div>
  );
}
