"use client";

import { AlertCircle, CheckCircle2, Download, LoaderCircle, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { downloadProgramTemplate, getImportRowErrors } from "@/apis/programs.api";
import { Select } from "@/components/ui/Select";
import { useImportProgram } from "@/hooks/usePrograms";
import { useSubjects } from "@/hooks/useSubjects";
import { handleApiError } from "@/lib/errorHandler";
import { downloadBlob } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./programs.module.scss";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Загрузка программы предмета для параллели из Excel (директор, завуч).
// Если программа уже есть, она заменяется вместе с отметками «пройдено».
export function ProgramImport({ onClose }: { onClose: () => void }) {
  const t = useTranslations("programs.import");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const subjectsQuery = useSubjects();
  const importMutation = useImportProgram();
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [templateError, setTemplateError] = useState("");

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    importMutation.reset();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!subjectId || !grade || !file) {
      return;
    }
    importMutation.mutate({ subjectId: Number(subjectId), gradeNumber: Number(grade), file });
  };

  const handleTemplate = async () => {
    setTemplateError("");
    try {
      downloadBlob(await downloadProgramTemplate(), "program-template.xlsx");
    } catch (error) {
      setTemplateError(handleApiError(error, tApiErrors));
    }
  };

  const rowErrors = importMutation.isError ? getImportRowErrors(importMutation.error) : [];

  return (
    <section className={adminStyles.card}>
      <div className={adminStyles.cardHeader}>
        <h2 className={adminStyles.cardTitle}>{t("title")}</h2>
        <button type="button" className={adminStyles.iconButton} aria-label={tForm("close")} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <p className={adminStyles.fieldHint}>{t("hint")}</p>

      <form className={styles.importForm} onSubmit={handleSubmit}>
        <div className={adminStyles.field}>
          <label htmlFor="program-subject">{t("subject")}</label>
          <Select
            id="program-subject"
            value={subjectId}
            onValueChange={setSubjectId}
            placeholder={tForm("choose")}
            options={(subjectsQuery.data ?? []).map((subject) => ({ value: String(subject.id), label: subject.name }))}
          />
        </div>
        <div className={adminStyles.field}>
          <label htmlFor="program-grade">{t("grade")}</label>
          <Select
            id="program-grade"
            value={grade}
            onValueChange={setGrade}
            placeholder={tForm("choose")}
            options={GRADES.map((value) => ({ value: String(value), label: t("gradeOption", { grade: value }) }))}
          />
        </div>
        <div className={adminStyles.field}>
          <span>{t("file")}</span>
          <label className={adminStyles.fileLabel}>
            <Upload size={16} aria-hidden="true" />
            {file?.name ?? t("chooseFile")}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFile}
            />
          </label>
        </div>

        <div className={adminStyles.formActions}>
          <button type="button" className={adminStyles.secondaryButton} onClick={handleTemplate}>
            <Download size={16} aria-hidden="true" />
            {t("template")}
          </button>
          <button
            type="submit"
            className={adminStyles.primaryButton}
            disabled={!subjectId || !grade || !file || importMutation.isPending}
          >
            {importMutation.isPending && <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />}
            {t("submit")}
          </button>
        </div>
      </form>

      {importMutation.isSuccess && (
        <p className={adminStyles.notice} role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {t("done", { count: importMutation.data.topics_count })}
        </p>
      )}

      {(importMutation.isError || templateError) && (
        <div className={adminStyles.formError} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <div>
            <p>{templateError || (rowErrors.length > 0 ? t("rowErrors") : handleApiError(importMutation.error, tApiErrors))}</p>
            {rowErrors.length > 0 && (
              <ul className={adminStyles.errorList}>
                {rowErrors.map((rowError) => (
                  <li key={rowError.row}>
                    {t("row", { row: rowError.row })} {rowError.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
