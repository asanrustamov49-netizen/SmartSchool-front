"use client";

import { KeyRound, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getClassName } from "@/apis/classes.api";
import type { Student, StudentCreated } from "@/apis/students.api";
import { DataState } from "@/components/ui/DataState";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { handleApiError } from "@/lib/errorHandler";
import { StudentForm } from "./StudentForm";
import styles from "./admin.module.scss";

type FormState = { isOpen: false } | { isOpen: true; student: Student | null };

export function StudentsPage() {
  const t = useTranslations("admin.students");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const studentsQuery = useStudents();
  const classesQuery = useClasses();
  const [formState, setFormState] = useState<FormState>({ isOpen: false });
  const [createdStudent, setCreatedStudent] = useState<StudentCreated | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const classes = classesQuery.data ?? [];
  const classNames = new Map(
    classes.map((schoolClass) => [schoolClass.id, getClassName(schoolClass)]),
  );

  // Backend не поддерживает поиск и фильтры, список фильтруется на клиенте.
  const normalizedSearch = search.trim().toLowerCase();
  const students = (studentsQuery.data ?? []).filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(normalizedSearch) ||
      student.inn.includes(normalizedSearch);
    const matchesClass = classFilter === "" || String(student.class_id) === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleCreated = (student: StudentCreated) => {
    setCreatedStudent(student);
    setFormState({ isOpen: false });
  };

  const openForm = (student: Student | null) => {
    setCreatedStudent(null);
    setFormState({ isOpen: true, student });
  };

  const renderList = () => {
    if (studentsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (studentsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(studentsQuery.error, tApiErrors)}
          onRetry={() => studentsQuery.refetch()}
        />
      );
    }

    if (students.length === 0) {
      const isFiltered = normalizedSearch !== "" || classFilter !== "";
      return (
        <DataState status="empty" message={isFiltered ? tForm("nothingFound") : t("empty")} />
      );
    }

    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("fullName")}</th>
              <th>{t("inn")}</th>
              <th>{t("class")}</th>
              <th>{t("phone")}</th>
              <th>{t("status")}</th>
              <th>
                <span className="sr-only">{tForm("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.full_name}</td>
                <td className={styles.cellMuted}>{student.inn}</td>
                <td>
                  {student.class_id !== null
                    ? (classNames.get(student.class_id) ?? "—")
                    : t("noClass")}
                </td>
                <td className={styles.cellMuted}>{student.phone ?? "—"}</td>
                <td className={student.is_active ? undefined : styles.statusInactive}>
                  {student.is_active ? t("active") : t("inactive")}
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => openForm(student)}
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
          <button type="button" className={styles.primaryButton} onClick={() => openForm(null)}>
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        )}
      </header>

      {createdStudent && (
        <section className={styles.card} role="status">
          <p className={styles.notice}>
            <KeyRound size={16} aria-hidden="true" />
            <span>
              {t("createdNotice", { name: createdStudent.full_name })}{" "}
              <span className={styles.secret}>{createdStudent.temporary_password}</span>
            </span>
          </p>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setCreatedStudent(null)}
            >
              {tForm("close")}
            </button>
          </div>
        </section>
      )}

      {formState.isOpen && (
        <StudentForm
          key={formState.student?.id ?? "new"}
          student={formState.student}
          classes={classes}
          onCreated={handleCreated}
          onClose={() => setFormState({ isOpen: false })}
        />
      )}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={styles.select}
            aria-label={t("classFilter")}
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="">{t("allClasses")}</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {getClassName(schoolClass)}
              </option>
            ))}
          </select>
        </div>
        {renderList()}
      </section>
    </div>
  );
}
