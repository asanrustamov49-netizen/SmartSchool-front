"use client";

import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  IdCard,
  KeyRound,
  Pencil,
  Plus,
  Upload,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getClassName } from "@/apis/classes.api";
import { downloadStudentsTemplate, type Student } from "@/apis/students.api";
import { DataState } from "@/components/ui/DataState";
import { RowActions } from "@/components/ui/RowActions";
import { Select } from "@/components/ui/Select";
import { useCreateIntent } from "@/hooks/useCreateIntent";
import { useClasses } from "@/hooks/useClasses";
import { useDeactivateStudent, useStudents } from "@/hooks/useStudents";
import { useResetUserPassword } from "@/hooks/useUsers";
import { handleApiError } from "@/lib/errorHandler";
import { cn,downloadBlob } from "@/lib/utils";
import { StudentForm } from "./StudentForm";
import { ExcelImport } from "./ExcelImport";
import { StudentCard } from "./StudentCard";
import styles from "./admin.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form"; student: Student | null }
  | { type: "import" }
  | { type: "card"; studentId: number }
  | { type: "confirm"; action: "reset" | "deactivate"; student: Student };

// Временный пароль показывается один раз: после создания ученика или сброса пароля.
type SecretNotice = { message: string; password: string };

export function StudentsPage() {
  const t = useTranslations("admin.students");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const studentsQuery = useStudents();
  const classesQuery = useClasses();
  const deactivateMutation = useDeactivateStudent();
  const resetPasswordMutation = useResetUserPassword();
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [secretNotice, setSecretNotice] = useState<SecretNotice | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const classes = classesQuery.data ?? [];
  const classNames = new Map(
    classes.map((schoolClass) => [schoolClass.id, getClassName(schoolClass)]),
  );
  const allStudents = studentsQuery.data ?? [];
  const existingInns = new Set(allStudents.map((student) => student.inn));

  // Backend не поддерживает поиск и фильтры, список фильтруется на клиенте.
  const normalizedSearch = search.trim().toLowerCase();
  const students = allStudents.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(normalizedSearch) ||
      student.inn.includes(normalizedSearch);
    const matchesClass = classFilter === "" || String(student.class_id) === classFilter;
    return matchesSearch && matchesClass;
  });

  const getStudentClassName = (student: Student) =>
    student.class_id !== null ? (classNames.get(student.class_id) ?? "—") : t("noClass");

  const openPanel = (nextPanel: Panel) => {
    setSecretNotice(null);
    setStatusMessage("");
    setActionError("");
    setPanel(nextPanel);
  };
  useCreateIntent("student", () => openPanel({ type: "form", student: null }));

  const handleTemplateDownload = async () => {
    setActionError("");
    try {
      downloadBlob(await downloadStudentsTemplate(), "students-template.xlsx");
    } catch (error) {
      setActionError(handleApiError(error, tApiErrors));
    }
  };

  // Экспортируется текущий отфильтрованный список. ИНН — текстом, чтобы сохранить ведущие нули.
  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      [t("fullName"), t("inn"), t("class"), t("phone"), t("status")],
      ...students.map((student) => [
        student.full_name,
        student.inn,
        getStudentClassName(student),
        student.phone ?? "",
        student.is_active ? t("active") : t("inactive"),
      ]),
    ]);
    sheet["!cols"] = [{ wch: 34 }, { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 12 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Students");
    const fileData: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const today = new Date().toISOString().slice(0, 10);
    downloadBlob(new Blob([fileData]), `students-${today}.xlsx`);
  };

  const handleConfirm = () => {
    if (panel.type !== "confirm") {
      return;
    }

    const { student } = panel;
    const onError = (error: unknown) => setActionError(handleApiError(error, tApiErrors));

    if (panel.action === "deactivate") {
      deactivateMutation.mutate(student.id, {
        onSuccess: () => {
          setPanel({ type: "none" });
          setStatusMessage(t("deactivated", { name: student.full_name }));
        },
        onError,
      });
      return;
    }

    resetPasswordMutation.mutate(student.id, {
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
        <DataState
          status="empty"
          message={isFiltered ? tForm("nothingFound") : t("empty")}
          action={isFiltered ? undefined : { label: t("add"), onClick: () => openPanel({ type: "form", student: null }) }}
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
                <td data-label={t("fullName")}>{student.full_name}</td>
                <td data-private data-label={t("inn")} className={styles.cellMuted}>{student.inn}</td>
                <td data-label={t("class")}>{getStudentClassName(student)}</td>
                <td data-private data-label={t("phone")} className={styles.cellMuted}>{student.phone ?? "—"}</td>
                <td data-label={t("status")} className={student.is_active ? undefined : styles.statusInactive}>
                  {student.is_active ? t("active") : t("inactive")}
                </td>
                <td data-actions>
                  <RowActions
                    menuLabel={`${tForm("actions")}: ${student.full_name}`}
                    primary={{ label: tForm("edit"), icon: Pencil, onSelect: () => openPanel({ type: "form", student }) }}
                    actions={[
                      {
                        label: t("card"),
                        icon: IdCard,
                        onSelect: () => openPanel({ type: "card", studentId: student.id }),
                      },
                      ...(student.is_active
                        ? [
                            {
                              label: t("resetPassword"),
                              icon: KeyRound,
                              onSelect: () => openPanel({ type: "confirm", action: "reset", student }),
                            },
                            {
                              label: t("deactivate"),
                              icon: UserX,
                              danger: true,
                              onSelect: () => openPanel({ type: "confirm", action: "deactivate", student }),
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const isConfirmPending = deactivateMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={handleTemplateDownload}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            {t("downloadTemplate")}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={students.length === 0}
            onClick={handleExport}
          >
            <Download size={16} aria-hidden="true" />
            {t("exportExcel")}
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
            onClick={() => openPanel({ type: "form", student: null })}
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
        <section className={styles.card} role="alertdialog" aria-labelledby="student-confirm">
          <p id="student-confirm" className={styles.notice}>
            {panel.action === "reset"
              ? t("confirmReset", { name: panel.student.full_name })
              : t("confirmDeactivate", { name: panel.student.full_name })}
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
              className={
                panel.action === "deactivate"
                  ? `${styles.primaryButton} ${styles.dangerButton}`
                  : styles.primaryButton
              }
              disabled={isConfirmPending}
              onClick={handleConfirm}
            >
              {panel.action === "reset" ? t("resetPassword") : t("deactivate")}
            </button>
          </div>
        </section>
      )}

      {panel.type === "form" && (
        <StudentForm
          key={panel.student?.id ?? "new"}
          student={panel.student}
          classes={classes}
          onCreated={(student) => {
            setPanel({ type: "none" });
            setSecretNotice({
              message: t("createdNotice", { name: student.full_name }),
              password: student.temporary_password,
            });
          }}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {panel.type === "card" && (
        <StudentCard
          key={panel.studentId}
          studentId={panel.studentId}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {panel.type === "import" && (
        <ExcelImport
          userType="students"
          classes={classes}
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
            ariaLabel={t("classFilter")}
            value={classFilter}
            onValueChange={setClassFilter}
            options={[
              { value: "", label: t("allClasses") },
              ...classes.map((schoolClass) => ({
                value: String(schoolClass.id),
                label: getClassName(schoolClass),
              })),
            ]}
          />
        </div>
        {renderList()}
      </section>
    </div>
  );
}
