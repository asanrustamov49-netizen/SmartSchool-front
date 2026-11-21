"use client";

import { AlertCircle, CheckCircle2, Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent } from "react";
import { getClassName, type SchoolClass } from "@/apis/classes.api";
import type { ExcelImportResult } from "@/apis/students.api";
import { Select } from "@/components/ui/Select";
import { useImportStudents } from "@/hooks/useStudents";
import { useImportTeachers } from "@/hooks/useTeachers";
import { handleApiError } from "@/lib/errorHandler";
import { downloadBlob } from "@/lib/utils";
import styles from "./admin.module.scss";

// Заголовки и порядок, которые строго проверяет backend (student_import.py, teacher_import.py).
// Файл пользователя может быть оформлен иначе: в backend уходит новый файл с этими заголовками.
const TEMPLATE_HEADERS = ["ИНН", "Толук аты-жөнү", "Телефон"];
// Заголовок ищется в первых строках листа: над ним может быть название таблицы.
const HEADER_SEARCH_ROWS = 10;
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

type ColumnKey = "inn" | "fullName" | "phone";
type ColumnMap = Record<ColumnKey, number | null>;

// Слова, по которым узнаётся столбец (в уже нормализованном заголовке).
// Проверяются по порядку: «Номер телефона» — это телефон, а не ФИО.
const COLUMN_HINTS: [ColumnKey, string[]][] = [
  ["inn", ["инн", "inn", "пин", "pin"]],
  ["phone", ["тел", "phone", "номер", "mobile"]],
  ["fullName", ["аты", "фио", "имя", "ысым", "жону", "фамилия", "name"]],
];

type ImportOutcome = {
  result: ExcelImportResult;
  // Backend нумерует строки отправленного файла, а в нём только валидные строки.
  // Здесь номера уже переведены в строки исходного файла пользователя.
  failedRows: { rowNumber: number; error: string }[];
};

type ExcelImportProps = {
  userType: "students" | "teachers";
  // Ученики импортируются в выбранный класс, учителя — без класса.
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

// Регистр, пробелы, дефисы и кыргызские буквы в заголовке не важны:
// «Толук аты-жөнү», «аты жону» и «ФИО» распознаются одинаково.
function normalizeHeader(value: unknown) {
  return cellToText(value)
    .toLowerCase()
    .replace(/ө/g, "о")
    .replace(/ү/g, "у")
    .replace(/ң/g, "н")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]/g, "");
}

function findColumns(cells: unknown[]): ColumnMap {
  const columns: ColumnMap = { inn: null, fullName: null, phone: null };

  cells.forEach((cell, index) => {
    const header = normalizeHeader(cell);
    if (header === "") {
      return;
    }

    const match = COLUMN_HINTS.find(
      ([key, hints]) => columns[key] === null && hints.some((hint) => header.includes(hint)),
    );
    if (match) {
      columns[match[0]] = index;
    }
  });

  return columns;
}

// Находит строку заголовка. Если заголовка нет, но в первом столбце уже ИНН,
// столбцы считаются в порядке шаблона: ИНН, ФИО, телефон.
function findTableLayout(table: unknown[][]) {
  for (let index = 0; index < Math.min(table.length, HEADER_SEARCH_ROWS); index += 1) {
    const columns = findColumns(table[index] ?? []);
    if (columns.inn !== null && columns.fullName !== null) {
      return { columns, firstDataRow: index + 1 };
    }
  }

  const firstFilledRow = table.findIndex((cells) => cells.some((cell) => cellToText(cell) !== ""));
  if (firstFilledRow >= 0 && INN_PATTERN.test(cellToText(table[firstFilledRow][0]).replace(/\s/g, ""))) {
    return { columns: { inn: 0, fullName: 1, phone: 2 }, firstDataRow: firstFilledRow };
  }

  return null;
}

function readCell(cells: unknown[], column: number | null) {
  return column === null ? "" : cellToText(cells[column]);
}

function findProblem(
  inn: string,
  fullName: string,
  seenInns: Set<string>,
  existingInns: Set<string>,
) {
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

export function ExcelImport({
  userType,
  classes,
  existingInns,
  onClose,
}: ExcelImportProps) {
  const t = useTranslations("admin.excelImport");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const importStudents = useImportStudents();
  const importTeachers = useImportTeachers();
  const importMutation =
    userType === "students" ? importStudents : importTeachers;
  const needsClass = userType === "students";
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
      const table: unknown[][] = sheet
        ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })
        : [];

      const layout = findTableLayout(table);
      if (!layout) {
        setFileError(t("wrongHeaders"));
        return;
      }
      const { columns, firstDataRow } = layout;

      const seenInns = new Set<string>();
      const parsedRows: ParsedRow[] = [];

      table.slice(firstDataRow).forEach((cells, index) => {
        // В ИНН часто попадают пробелы-разделители: «115 031 985 00456».
        const inn = readCell(cells, columns.inn).replace(/\s/g, "");
        const fullName = readCell(cells, columns.fullName);
        const phone = readCell(cells, columns.phone);

        if (inn === "" && fullName === "" && phone === "") {
          return;
        }

        const problem = findProblem(inn, fullName, seenInns, existingInns);
        if (INN_PATTERN.test(inn)) {
          seenInns.add(inn);
        }

        parsedRows.push({
          rowNumber: firstDataRow + index + 1,
          inn,
          fullName,
          phone,
          problem,
        });
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
    if ((needsClass && classId === "") || validRows.length === 0) {
      return;
    }

    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ...validRows.map((row) => [row.inn, row.fullName, row.phone]),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Import");
    const fileData: ArrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const file = new Blob([fileData]);

    try {
      const result = needsClass
        ? await importStudents.mutateAsync({ classId: Number(classId), file })
        : await importTeachers.mutateAsync(file);

      const failedRows = result.errors.map((error) => ({
        rowNumber: validRows[error.row - 2]?.rowNumber ?? error.row,
        error: error.error,
      }));
      setOutcome({ result, failedRows });
      setRows([]);
      setFileName("");
    } catch {
      // Ошибка запроса показывается из состояния мутации.
    }
  };

  const downloadPasswords = async () => {
    if (!outcome) {
      return;
    }

    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      [
        t("passwordColumns.inn"),
        t("passwordColumns.fullName"),
        t("passwordColumns.password"),
      ],
      ...outcome.result.added_users.map((user) => [
        user.inn,
        user.full_name,
        user.temporary_password,
      ]),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Passwords");
    const fileData: ArrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    downloadBlob(new Blob([fileData]), `${userType}-passwords.xlsx`);
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t(`title.${userType}`)}</h2>
      <p className={styles.fieldHint}>
        {t("description")}
      </p>

      <div className={styles.form}>
        {needsClass && (
          <label className={styles.field}>
            <span>{t("classLabel")}</span>
            <Select
              value={classId}
              onValueChange={setClassId}
              placeholder={tForm("choose")}
              options={classes.map((schoolClass) => ({
                value: String(schoolClass.id),
                label: getClassName(schoolClass),
              }))}
            />
          </label>
        )}

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
            {t("summary", {
              valid: validRows.length,
              invalid: invalidRows.length,
            })}
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
                    <td data-private>{row.inn || "—"}</td>
                    <td>{row.fullName || "—"}</td>
                    <td className={styles.cellMuted}>{row.phone || "—"}</td>
                    <td
                      className={
                        row.problem ? styles.statusInactive : styles.statusOk
                      }
                    >
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

          {outcome.result.added_users.length > 0 && (
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
                    {outcome.result.added_users.map((user) => (
                      <tr key={user.inn}>
                        <td data-private className={styles.cellMuted}>{user.inn}</td>
                        <td>{user.full_name}</td>
                        <td className={styles.secret}>
                          {user.temporary_password}
                        </td>
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
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onClose}
        >
          {tForm("close")}
        </button>
        {outcome && outcome.result.added_users.length > 0 && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={downloadPasswords}
          >
            <Download size={16} aria-hidden="true" />
            {t("downloadPasswords")}
          </button>
        )}
        {rows.length > 0 && (
          <button
            type="button"
            className={styles.primaryButton}
            disabled={
              (needsClass && classId === "") ||
              validRows.length === 0 ||
              importMutation.isPending
            }
            onClick={handleSubmit}
          >
            {importMutation.isPending
              ? t("importing")
              : t("submit", { count: validRows.length })}
          </button>
        )}
      </div>
      {rows.length > 0 && needsClass && classId === "" && (
        <p className={styles.fieldHint}>{t("chooseClassFirst")}</p>
      )}
    </section>
  );
}
