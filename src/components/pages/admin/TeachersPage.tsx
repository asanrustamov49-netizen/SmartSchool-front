"use client";

import { AlertCircle, FileSpreadsheet, Info, KeyRound, Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { downloadTeachersTemplate, type TeacherCreated } from "@/apis/teachers.api";
import { handleApiError } from "@/lib/errorHandler";
import { downloadBlob } from "@/lib/utils";
import { ExcelImport } from "./ExcelImport";
import { TeacherForm } from "./TeacherForm";
import styles from "./admin.module.scss";

type Panel = "none" | "form" | "import";

const NO_EXISTING_INNS = new Set<string>();

// Backend умеет создавать и импортировать учителей, но не отдаёт их список (нет GET /teachers).
// Поэтому на странице только действия, без таблицы.
export function TeachersPage() {
  const t = useTranslations("admin.teachers");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const [panel, setPanel] = useState<Panel>("none");
  const [createdTeacher, setCreatedTeacher] = useState<TeacherCreated | null>(null);
  const [templateError, setTemplateError] = useState("");

  const openPanel = (nextPanel: Panel) => {
    setCreatedTeacher(null);
    setPanel(nextPanel);
  };

  const handleTemplateDownload = async () => {
    setTemplateError("");
    try {
      downloadBlob(await downloadTeachersTemplate(), "teachers-template.xlsx");
    } catch (error) {
      setTemplateError(handleApiError(error, tApiErrors));
    }
  };

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
            onClick={() => openPanel("import")}
          >
            <Upload size={16} aria-hidden="true" />
            {t("importExcel")}
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => openPanel("form")}>
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        </div>
      </header>

      {templateError && (
        <p className={styles.formError} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {templateError}
        </p>
      )}

      {createdTeacher && (
        <section className={styles.card} role="status">
          <p className={styles.notice}>
            <KeyRound size={16} aria-hidden="true" />
            <span>
              {t("createdNotice", { name: createdTeacher.full_name })}{" "}
              <span className={styles.secret}>{createdTeacher.temporary_password}</span>
            </span>
          </p>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setCreatedTeacher(null)}
            >
              {tForm("close")}
            </button>
          </div>
        </section>
      )}

      {panel === "form" && (
        <TeacherForm
          onCreated={(teacher) => {
            setPanel("none");
            setCreatedTeacher(teacher);
          }}
          onClose={() => setPanel("none")}
        />
      )}

      {panel === "import" && (
        <ExcelImport
          userType="teachers"
          classes={[]}
          existingInns={NO_EXISTING_INNS}
          onClose={() => setPanel("none")}
        />
      )}

      <section className={styles.card}>
        <p className={styles.notice}>
          <Info size={16} aria-hidden="true" />
          {t("listUnavailable")}
        </p>
      </section>
    </div>
  );
}
