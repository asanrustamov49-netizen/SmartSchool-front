"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getClassName, type SchoolClass } from "@/apis/classes.api";
import { DataState } from "@/components/ui/DataState";
import { useClasses } from "@/hooks/useClasses";
import { useSchoolUser } from "@/hooks/useUsers";
import { handleApiError } from "@/lib/errorHandler";
import { ClassForm } from "./ClassForm";
import styles from "./admin.module.scss";

// В ClassOut есть только class_teacher_id, имя берётся из GET /users/{id}.
function ClassTeacherName({ teacherId }: { teacherId: number | null }) {
  const t = useTranslations("admin.classes");
  const teacherQuery = useSchoolUser(teacherId);

  if (teacherId === null) {
    return <span className={styles.cellMuted}>{t("noClassTeacher")}</span>;
  }

  return <span>{teacherQuery.data?.full_name ?? "…"}</span>;
}

type FormState = { isOpen: false } | { isOpen: true; schoolClass: SchoolClass | null };

export function ClassesPage() {
  const t = useTranslations("admin.classes");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const classesQuery = useClasses();
  const [formState, setFormState] = useState<FormState>({ isOpen: false });
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const classes = (classesQuery.data ?? []).filter(
    (schoolClass) =>
      getClassName(schoolClass).toLowerCase().includes(normalizedSearch) ||
      schoolClass.academic_year.toLowerCase().includes(normalizedSearch),
  );

  const closeForm = () => setFormState({ isOpen: false });

  const renderList = () => {
    if (classesQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (classesQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(classesQuery.error, tApiErrors)}
          onRetry={() => classesQuery.refetch()}
        />
      );
    }

    if (classes.length === 0) {
      return (
        <DataState
          status="empty"
          message={normalizedSearch ? tForm("nothingFound") : t("empty")}
        />
      );
    }

    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("className")}</th>
              <th>{t("academicYear")}</th>
              <th>{t("classTeacher")}</th>
              <th>
                <span className="sr-only">{tForm("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {classes.map((schoolClass) => (
              <tr key={schoolClass.id}>
                <td>{getClassName(schoolClass)}</td>
                <td className={styles.cellMuted}>{schoolClass.academic_year}</td>
                <td>
                  <ClassTeacherName teacherId={schoolClass.class_teacher_id} />
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setFormState({ isOpen: true, schoolClass })}
                  >
                    {tForm("edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        {!formState.isOpen && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setFormState({ isOpen: true, schoolClass: null })}
          >
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        )}
      </header>

      {formState.isOpen && (
        <ClassForm
          key={formState.schoolClass?.id ?? "new"}
          schoolClass={formState.schoolClass}
          onClose={closeForm}
        />
      )}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={tForm("search")}
            aria-label={tForm("search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {renderList()}
      </section>
    </div>
  );
}
