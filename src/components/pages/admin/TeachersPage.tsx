"use client";

import {
  AlertCircle,
  BookOpen,
  FileKey,
  FileSpreadsheet,
  KeyRound,
  Pencil,
  Plus,
  Upload,
  UserCheck,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { downloadTeachersCredentials } from "@/apis/credentials.api";
import { downloadTeachersTemplate, type Teacher } from "@/apis/teachers.api";
import { DataState } from "@/components/ui/DataState";
import { RowActions } from "@/components/ui/RowActions";
import { Select } from "@/components/ui/Select";
import { useCreateIntent } from "@/hooks/useCreateIntent";
import { useSetTeacherActive, useTeachers } from "@/hooks/useTeachers";
import { useResetUserPassword } from "@/hooks/useUsers";
import { handleApiError } from "@/lib/errorHandler";
import { cn, downloadBlob } from "@/lib/utils";
import { ExcelImport } from "./ExcelImport";
import { TeacherAssignments } from "./TeacherAssignments";
import { TeacherForm } from "./TeacherForm";
import styles from "./admin.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form"; teacher: Teacher | null }
  | { type: "import" }
  // Храним id, а не объект: после назначения список обновится и панель покажет свежие данные.
  | { type: "assignments"; teacherId: number }
  | { type: "confirm"; action: "reset" | "deactivate"; teacher: Teacher };

type StatusFilter = "all" | "active" | "inactive";

// Временный пароль показывается один раз: после создания учителя или сброса пароля.
type SecretNotice = { message: string; password: string };

function getSubjectNames(teacher: Teacher) {
  const names = teacher.assignments
    .map((assignment) => assignment.subject_name)
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

export function TeachersPage() {
  const t = useTranslations("admin.teachers");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const teachersQuery = useTeachers();
  const setActiveMutation = useSetTeacherActive();
  const resetPasswordMutation = useResetUserPassword();
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [secretNotice, setSecretNotice] = useState<SecretNotice | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const allTeachers = teachersQuery.data ?? [];
  const assignmentTeacher =
    panel.type === "assignments"
      ? allTeachers.find((teacher) => teacher.id === panel.teacherId)
      : undefined;
  const existingInns = new Set(allTeachers.map((teacher) => teacher.inn));
  const normalizedSearch = search.trim().toLowerCase();
  const teachers = allTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.full_name.toLowerCase().includes(normalizedSearch) ||
      teacher.inn.includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active") === teacher.is_active;
    return matchesSearch && matchesStatus;
  });

  const openPanel = (nextPanel: Panel) => {
    setSecretNotice(null);
    setStatusMessage("");
    setActionError("");
    setPanel(nextPanel);
  };
  useCreateIntent("teacher", () => openPanel({ type: "form", teacher: null }));

  const handleTemplateDownload = async () => {
    setActionError("");
    try {
      downloadBlob(await downloadTeachersTemplate(), "teachers-template.xlsx");
    } catch (error) {
      setActionError(handleApiError(error, tApiErrors));
    }
  };

  // Лист логинов: у кого ещё временный пароль, он виден в файле.
  const handleCredentialsDownload = async () => {
    setActionError("");
    try {
      downloadBlob(await downloadTeachersCredentials(), "teachers-logins.xlsx");
    } catch (error) {
      setActionError(handleApiError(error, tApiErrors));
    }
  };

  const handleActivate = (teacher: Teacher) => {
    openPanel({ type: "none" });
    setActiveMutation.mutate(
      { teacherId: teacher.id, active: true },
      {
        onSuccess: () => setStatusMessage(t("activated", { name: teacher.full_name })),
        onError: (error) => setActionError(handleApiError(error, tApiErrors)),
      },
    );
  };

  const handleConfirm = () => {
    if (panel.type !== "confirm") {
      return;
    }

    const { teacher } = panel;
    const onError = (error: unknown) => setActionError(handleApiError(error, tApiErrors));

    if (panel.action === "deactivate") {
      setActiveMutation.mutate(
        { teacherId: teacher.id, active: false },
        {
          onSuccess: () => {
            setPanel({ type: "none" });
            setStatusMessage(t("deactivated", { name: teacher.full_name }));
          },
          onError,
        },
      );
      return;
    }

    resetPasswordMutation.mutate(teacher.id, {
      onSuccess: (result) => {
        setPanel({ type: "none" });
        setSecretNotice({
          message: t("passwordResetNotice", { name: result.full_name }),
          password: result.temporary_password,
        });
      },
      onError,
    });
  };

  const renderList = () => {
    if (teachersQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (teachersQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(teachersQuery.error, tApiErrors)}
          onRetry={() => teachersQuery.refetch()}
        />
      );
    }

    if (teachers.length === 0) {
      const isFiltered = normalizedSearch !== "" || statusFilter !== "all";
      return (
        <DataState
          status="empty"
          message={isFiltered ? tForm("nothingFound") : t("empty")}
          action={isFiltered ? undefined : { label: t("add"), onClick: () => openPanel({ type: "form", teacher: null }) }}
        />
      );
    }

    return (
      <div className={styles.tableWrap}>
        <table className={cn(styles.table, styles.responsiveTable)}>
          <thead>
            <tr>
              <th>{t("fullName")}</th>
              <th>{t("inn")}</th>
              <th className={styles.optionalColumn}>{t("phone")}</th>
              <th>{t("classesLed")}</th>
              <th>{t("subjects")}</th>
              <th>{t("status")}</th>
              <th>
                <span className="sr-only">{tForm("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => {
              const subjectNames = getSubjectNames(teacher);

              return (
                <tr key={teacher.id}>
                  <td data-label={t("fullName")}>
                    {teacher.full_name}
                    {teacher.is_temp_password && (
                      <span className={styles.tag} title={t("tempPasswordHint")}>
                        {t("tempPassword")}
                      </span>
                    )}
                  </td>
                  <td data-label={t("inn")} className={styles.cellMuted}>{teacher.inn}</td>
                  <td data-label={t("phone")} className={cn(styles.cellMuted, styles.optionalColumn)}>{teacher.phone ?? "—"}</td>
                  <td data-label={t("classesLed")}>
                    {teacher.classes_led.length > 0
                      ? teacher.classes_led.map((schoolClass) => schoolClass.name).join(", ")
                      : "—"}
                  </td>
                  <td data-label={t("subjects")} className={cn(styles.cellMuted, styles.cellWrap)}>
                    {subjectNames.length > 0 ? subjectNames.join(", ") : "—"}
                  </td>
                  <td data-label={t("status")} className={teacher.is_active ? undefined : styles.statusInactive}>
                    {teacher.is_active ? t("active") : t("inactive")}
                  </td>
                  <td data-actions>
                    <RowActions
                      menuLabel={`${tForm("actions")}: ${teacher.full_name}`}
                      primary={{ label: tForm("edit"), icon: Pencil, onSelect: () => openPanel({ type: "form", teacher }) }}
                      actions={
                        teacher.is_active
                          ? [
                              {
                                label: t("subjectsAction"),
                                icon: BookOpen,
                                onSelect: () => openPanel({ type: "assignments", teacherId: teacher.id }),
                              },
                              {
                                label: t("resetPassword"),
                                icon: KeyRound,
                                onSelect: () => openPanel({ type: "confirm", action: "reset", teacher }),
                              },
                              {
                                label: t("deactivate"),
                                icon: UserX,
                                danger: true,
                                onSelect: () => openPanel({ type: "confirm", action: "deactivate", teacher }),
                              },
                            ]
                          : [
                              {
                                label: t("activate"),
                                icon: UserCheck,
                                disabled: setActiveMutation.isPending,
                                onSelect: () => handleActivate(teacher),
                              },
                            ]
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const isConfirmPending = setActiveMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={handleCredentialsDownload}>
            <FileKey size={16} aria-hidden="true" />
            {t("downloadLogins")}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleTemplateDownload}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            {t("downloadTemplate")}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => openPanel({ type: "import" })}
          >
            <Upload size={16} aria-hidden="true" />
            {t("importExcel")}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => openPanel({ type: "form", teacher: null })}
          >
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        </div>
      </header>

      {actionError && panel.type !== "confirm" && (
        <p className={styles.formError} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {actionError}
        </p>
      )}

      {statusMessage && (
        <p className={styles.notice} role="status">
          {statusMessage}
        </p>
      )}

      {secretNotice && (
        <section className={styles.card} role="status">
          <p className={styles.notice}>
            <KeyRound size={16} aria-hidden="true" />
            <span>
              {secretNotice.message}{" "}
              <span className={styles.secret}>{secretNotice.password}</span>
            </span>
          </p>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setSecretNotice(null)}
            >
              {tForm("close")}
            </button>
          </div>
        </section>
      )}

      {panel.type === "confirm" && (
        <section className={styles.card} role="alertdialog" aria-labelledby="teacher-confirm">
          <p id="teacher-confirm" className={styles.notice}>
            {panel.action === "reset"
              ? t("confirmReset", { name: panel.teacher.full_name })
              : t("confirmDeactivate", { name: panel.teacher.full_name })}
          </p>
          {actionError && (
            <p className={styles.formError} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {actionError}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => openPanel({ type: "none" })}
            >
              {tForm("cancel")}
            </button>
            <button
              type="button"
              className={cn(
                styles.primaryButton,
                panel.action === "deactivate" && styles.dangerButton,
              )}
              disabled={isConfirmPending}
              onClick={handleConfirm}
            >
              {panel.action === "reset" ? t("resetPassword") : t("deactivate")}
            </button>
          </div>
        </section>
      )}

      {panel.type === "form" && (
        <TeacherForm
          key={panel.teacher?.id ?? "new"}
          teacher={panel.teacher}
          onCreated={(teacher) => {
            setPanel({ type: "none" });
            setSecretNotice({
              message: t("createdNotice", { name: teacher.full_name }),
              password: teacher.temporary_password,
            });
          }}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {panel.type === "assignments" && assignmentTeacher && (
        <TeacherAssignments
          teacher={assignmentTeacher}
          allTeachers={allTeachers}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {panel.type === "import" && (
        <ExcelImport
          userType="teachers"
          classes={[]}
          existingInns={existingInns}
          onClose={() => setPanel({ type: "none" })}
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
          <Select
            className={styles.toolbarSelect}
            ariaLabel={t("statusFilter")}
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            options={[
              { value: "all", label: t("allStatuses") },
              { value: "active", label: t("onlyActive") },
              { value: "inactive", label: t("onlyInactive") },
            ]}
          />
          {teachersQuery.data && (
            <span className={styles.toolbarCount}>
              {t("count", { count: teachers.length })}
            </span>
          )}
        </div>
        {renderList()}
      </section>
    </div>
  );
}
