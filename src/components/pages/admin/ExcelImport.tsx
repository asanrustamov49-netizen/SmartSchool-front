"use client";

import { AlertCircle, CheckCircle2, Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent } from "react";
import { getClassName, type SchoolClass } from "@/apis/classes.api";
import type { StudentImportResult } from "@/apis/students.api";
import { useImportStudents } from "@/hooks/useStudents";
import { handleApiError } from "@/lib/errorHandler";
import { downloadBlob } from "@/lib/utils";
import styles from "./admin.module.scss";

// Колонки и правила те же, что проверяет backend (student_import.py).
const TEMPLATE_HEADERS = ["ИНН", "Толук аты-жөнү", "Телефон"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const INN_PATTERN = /^\d{14}$/;

type RowProblem = "innFormat" | "duplicate" | "nameShort" | "exists";

type ParsedRow = {
  rowNumber: number;
  inn: string;
  fullName: string;
  phone: string;
  problem: RowProblem | null;
};

type ImportOutcome = {
  result: StudentImportResult;
  // Backend нумерует строки отправленного файла, а в нём только валидные строки.
  // Здесь номера уже переведены в строки исходного файла пользователя.
  failedRows: { rowNumber: number; error: string }[];
};

type StudentsImportProps = {
  classes: SchoolClass[];
  existingInns: Set<string>;
  onClose: () => void;
};

function cellToText(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function findProblem(inn: string, fullName: string, seenInns: Set<string>, existingInns: Set<string>) {
  if (!INN_PATTERN.test(inn)) {
    return "innFormat";
  }

  if (seenInns.has(inn)) {
    return "duplicate";
  }

  if (fullName.length < 3) {
    return "nameShort";
  }

  if (existingInns.has(inn)) {
    return "exists";
  }

  return null;
}

export function StudentsImport({ classes, existingInns, onClose }: StudentsImportProps) {
  const t = useTranslations("admin.students.import");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const importMutation = useImportStudents();
  const [classId, setClassId] = useState("");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileError, setFileError] = useState("");
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  const validRows = rows.filter((row) => row.problem === null);
  const invalidRows = rows.filter((row) => row.problem !== null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setRows([]);
    setFileError("");
    setOutcome(null);
    importMutation.reset();

    if (!file) {
      return;
    }

    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFileError(t("wrongFormat"));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(t("tooLarge"));
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const table: unknown[][] = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) : [];

      const headers = (table[0] ?? []).slice(0, 3).map((cell) => cellToText(cell).toLowerCase());
      const expectedHeaders = TEMPLATE_HEADERS.map((header) => header.toLowerCase());
      if (headers.join("|") !== expectedHeaders.join("|")) {
        setFileError(t("wrongHeaders", { columns: TEMPLATE_HEADERS.join(", ") }));
        return;
      }

      const seenInns = new Set<string>();
      const parsedRows: ParsedRow[] = [];

      table.slice(1).forEach((cells, index) => {
        const inn = cellToText(cells[0]);
        const fullName = cellToText(cells[1]);
        const phone = cellToText(cells[2]);

        if (inn === "" && fullName === "" && phone === "") {
          return;
        }

        const problem = findProblem(inn, fullName, seenInns, existingInns);
        if (INN_PATTERN.test(inn)) {
          seenInns.add(inn);
        }

        parsedRows.push({ rowNumber: index + 2, inn, fullName, phone, problem });
      });

      if (parsedRows.length === 0) {
        setFileError(t("emptyFile"));
        return;
      }

      setRows(parsedRows);
    } catch {
      setFileError(t("readError"));
    }
  };

  // В backend уходит новый файл только с валидными строками.
  // ИНН записывается текстом, чтобы не потерять ведущие нули.
  const handleSubmit = async () => {
    if (classId === "" || validRows.length === 0) {
      return;
    }

    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ...validRows.map((row) => [row.inn, row.fullName, row.phone]),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Students");
    const fileData: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    importMutation.mutate(
      { classId: Number(classId), file: new Blob([fileData]) },
      {
        onSuccess: (result) => {
          const failedRows = result.errors.map((error) => ({
            rowNumber: validRows[error.row - 2]?.rowNumber ?? error.row,
            error: error.error,
          }));
          setOutcome({ result, failedRows });
          setRows([]);
          setFileName("");
        },
      },
    );
  };

  const downloadPasswords = async () => {
    if (!outcome) {
      return;
    }

    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      [t("passwordColumns.inn"), t("passwordColumns.fullName"), t("passwordColumns.password")],
      ...outcome.result.added_students.map((student) => [
        student.inn,
        student.full_name,
        student.temporary_password,
      ]),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Passwords");
    const fileData: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    downloadBlob(new Blob([fileData]), "students-passwords.xlsx");
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("title")}</h2>
      <p className={styles.fieldHint}>{t("description", { columns: TEMPLATE_HEADERS.join(", ") })}</p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>{t("classLabel")}</span>
          <select
            className={styles.select}
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">{tForm("choose")}</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {getClassName(schoolClass)}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.field}>
          <span>{t("fileLabel")}</span>
          <label className={styles.fileLabel}>
            <Upload size={16} aria-hidden="true" />
            {fileName || t("chooseFile")}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {fileError && (
          <p className={styles.formError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {fileError}
          </p>
        )}

        {importMutation.isError && (
          <p className={styles.formError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {handleApiError(importMutation.error, tApiErrors)}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <p className={styles.notice}>
            {t("summary", { valid: validRows.length, invalid: invalidRows.length })}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("rowNumber")}</th>
                  <th>{t("passwordColumns.inn")}</th>
                  <th>{t("passwordColumns.fullName")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("check")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className={styles.cellMuted}>{row.rowNumber}</td>
                    <td>{row.inn || "—"}</td>
                    <td>{row.fullName || "—"}</td>
                    <td className={styles.cellMuted}>{row.phone || "—"}</td>
                    <td className={row.problem ? styles.statusInactive : styles.statusOk}>
                      {row.problem ? t(`problems.${row.problem}`) : t("ready")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {outcome && (
        <div className={styles.importResult} role="status">
          <p className={styles.notice}>
            <CheckCircle2 size={16} aria-hidden="true" />
            {t("resultAdded", { count: outcome.result.total_added })}
          </p>

          {outcome.failedRows.length > 0 && (
            <div className={styles.formError}>
              <AlertCircle size={16} aria-hidden="true" />
              <div>
                <p>{t("resultErrors", { count: outcome.failedRows.length })}</p>
                <ul className={styles.errorList}>
                  {outcome.failedRows.map((row) => (
                    <li key={row.rowNumber}>
                      {t("rowError", { row: row.rowNumber })} {row.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {outcome.result.added_students.length > 0 && (
            <>
              <p className={styles.fieldHint}>{t("passwordsNotice")}</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t("passwordColumns.inn")}</th>
                      <th>{t("passwordColumns.fullName")}</th>
                      <th>{t("passwordColumns.password")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outcome.result.added_students.map((student) => (
                      <tr key={student.inn}>
                        <td className={styles.cellMuted}>{student.inn}</td>
                        <td>{student.full_name}</td>
                        <td className={styles.secret}>{student.temporary_password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.secondaryButton} onClick={onClose}>
          {tForm("close")}
        </button>
        {outcome && outcome.result.added_students.length > 0 && (
          <button type="button" className={styles.secondaryButton} onClick={downloadPasswords}>
            <Download size={16} aria-hidden="true" />
            {t("downloadPasswords")}
          </button>
        )}
        {rows.length > 0 && (
          <button
            type="button"
            className={styles.primaryButton}
            disabled={classId === "" || validRows.length === 0 || importMutation.isPending}
            onClick={handleSubmit}
          >
            {importMutation.isPending
              ? t("importing")
              : t("submit", { count: validRows.length })}
          </button>
        )}
      </div>
      {rows.length > 0 && classId === "" && <p className={styles.fieldHint}>{t("chooseClassFirst")}</p>}
    </section>
  );
}
