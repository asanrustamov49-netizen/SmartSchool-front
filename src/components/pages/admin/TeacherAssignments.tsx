"use client";

import { AlertCircle, CircleAlert, LoaderCircle, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getClassName } from "@/apis/classes.api";
import type { Teacher } from "@/apis/teachers.api";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useCreateAssignment, useDeleteAssignment } from "@/hooks/useTeachers";
import { handleApiError } from "@/lib/errorHandler";
import styles from "./admin.module.scss";

type TeacherAssignmentsProps = {
  teacher: Teacher;
  // Нужны, чтобы предупредить, если класс и предмет уже ведёт другой учитель.
  allTeachers: Teacher[];
  onClose: () => void;
};

// Назначение = учитель ведёт предмет в конкретном классе. По нему появляется журнал,
// а предмет — в списке учителя и на его главной.
export function TeacherAssignments({ teacher, allTeachers, onClose }: TeacherAssignmentsProps) {
  const t = useTranslations("admin.teachers.assignments");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const currentUserQuery = useCurrentUser();
  const classesQuery = useClasses();
  const subjectsQuery = useSubjects();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const classes = classesQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const selectedClass = classes.find((schoolClass) => String(schoolClass.id) === classId);

  const isDuplicate = teacher.assignments.some(
    (assignment) =>
      String(assignment.class_id) === classId && String(assignment.subject_id) === subjectId,
  );
  const otherTeachers = allTeachers.filter(
    (other) =>
      other.id !== teacher.id &&
      other.assignments.some(
        (assignment) =>
          String(assignment.class_id) === classId && String(assignment.subject_id) === subjectId,
      ),
  );

  const handleAdd = () => {
    const schoolId = currentUserQuery.data?.school_id;
    if (!selectedClass || subjectId === "" || schoolId === undefined || isDuplicate) {
      return;
    }

    createAssignment.mutate(
      {
        teacher_id: teacher.id,
        class_id: selectedClass.id,
        subject_id: Number(subjectId),
        school_id: schoolId,
        academic_year: selectedClass.academic_year,
      },
      { onSuccess: () => setSubjectId("") },
    );
  };

  const renderList = () => {
    if (teacher.assignments.length === 0) {
      return <p className={styles.fieldHint}>{t("empty")}</p>;
    }

    return (
      <ul className={styles.assignmentList}>
        {teacher.assignments.map((assignment) => (
          <li key={assignment.id} className={styles.assignmentItem}>
            <span>
              <strong>{assignment.class_name ?? "—"}</strong> · {assignment.subject_name ?? "—"}
              <small>{assignment.academic_year}</small>
            </span>

            {confirmId === assignment.id ? (
              <span className={styles.assignmentConfirm}>
                <small>{t("confirmRemove")}</small>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setConfirmId(null)}
                >
                  {tForm("cancel")}
                </button>
                <button
                  type="button"
                  className={styles.dangerLink}
                  disabled={deleteAssignment.isPending}
                  onClick={() =>
                    deleteAssignment.mutate(assignment.id, { onSuccess: () => setConfirmId(null) })
                  }
                >
                  {t("remove")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={styles.iconTextButton}
                aria-label={t("removeLabel", {
                  name: `${assignment.class_name ?? ""} · ${assignment.subject_name ?? ""}`,
                })}
                onClick={() => {
                  deleteAssignment.reset();
                  setConfirmId(assignment.id);
                }}
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const isLoading = classesQuery.isPending || subjectsQuery.isPending;
  const loadError = classesQuery.error ?? subjectsQuery.error;
  const error = createAssignment.error ?? deleteAssignment.error;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("title", { name: teacher.full_name })}</h2>
      <p className={styles.fieldHint}>{t("description")}</p>

      {renderList()}

      {error && (
        <p className={styles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(error, tApiErrors)}
        </p>
      )}

      <h3 className={styles.subTitle}>{t("addTitle")}</h3>
      {isLoading && <DataState status="loading" />}
      {loadError && (
        <DataState
          status="error"
          message={handleApiError(loadError, tApiErrors)}
          onRetry={() => {
            classesQuery.refetch();
            subjectsQuery.refetch();
          }}
        />
      )}
      {!isLoading && !loadError && (
        <>
          <div className={styles.toolbar}>
            <select
              className={styles.select}
              aria-label={t("class")}
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">{t("chooseClass")}</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {getClassName(schoolClass)} · {schoolClass.academic_year}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              aria-label={t("subject")}
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="">{t("chooseSubject")}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={
                classId === "" || subjectId === "" || isDuplicate || createAssignment.isPending
              }
              onClick={handleAdd}
            >
              {createAssignment.isPending ? (
                <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
              ) : (
                <Plus size={16} aria-hidden="true" />
              )}
              {t("assign")}
            </button>
          </div>

          {isDuplicate && <p className={styles.fieldHint}>{t("duplicate")}</p>}
          {!isDuplicate && otherTeachers.length > 0 && (
            <p className={styles.notice}>
              <AlertCircle size={16} aria-hidden="true" />
              {t("alreadyTaught", { names: otherTeachers.map((other) => other.full_name).join(", ") })}
            </p>
          )}
          {classes.length === 0 && <p className={styles.fieldHint}>{t("noClasses")}</p>}
          {subjects.length === 0 && <p className={styles.fieldHint}>{t("noSubjects")}</p>}
        </>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.secondaryButton} onClick={onClose}>
          {tForm("close")}
        </button>
      </div>
    </section>
  );
}
