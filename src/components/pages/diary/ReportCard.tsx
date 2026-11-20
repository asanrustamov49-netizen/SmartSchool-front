"use client";

import { useTranslations } from "next-intl";
import type { GradesSummary, PeriodKey } from "@/apis/journal.api";
import scss from "./reportCard.module.scss";

const PERIOD_KEYS: PeriodKey[] = ["Q1", "Q2", "Q3", "Q4", "YEAR"];

type ReportCardProps = {
  summary: GradesSummary;
  schoolName: string | null;
  className: string | null;
  date: string;
};

// Табель для печати: на экране скрыт, при печати показывается только он.
// В окне печати браузера его можно сохранить как PDF — без отдельной библиотеки.
export function ReportCard({ summary, schoolName, className, date }: ReportCardProps) {
  const t = useTranslations("diary.reportCard");
  const tJournal = useTranslations("journal");
  // Колонки четвертей печатаются, только если хоть одна итоговая оценка уже есть.
  const hasPeriodGrades = summary.subjects.some(
    (subject) => Object.keys(subject.period_grades ?? {}).length > 0,
  );

  return (
    <section className={scss.reportCard} aria-hidden="true">
      {schoolName && <p className={scss.school}>{schoolName}</p>}
      <h1>{t("title")}</h1>
      <dl className={scss.meta}>
        <div>
          <dt>{t("student")}</dt>
          <dd>{summary.full_name}</dd>
        </div>
        {className && (
          <div>
            <dt>{t("class")}</dt>
            <dd>{className}</dd>
          </div>
        )}
        <div>
          <dt>{t("date")}</dt>
          <dd>{date}</dd>
        </div>
      </dl>

      <table>
        <thead>
          <tr>
            <th>{t("subject")}</th>
            <th>{t("gradesCount")}</th>
            <th>{t("average")}</th>
            <th>{tJournal("attendanceCodes.Ж")}</th>
            <th>{tJournal("attendanceCodes.К")}</th>
            {hasPeriodGrades &&
              PERIOD_KEYS.map((period) => <th key={period}>{tJournal(`periodNames.${period}`)}</th>)}
          </tr>
        </thead>
        <tbody>
          {summary.subjects.map((subject) => (
            <tr key={subject.subject_id}>
              <td>{subject.subject_name}</td>
              <td>{subject.grades_count}</td>
              <td>{subject.average?.toFixed(1) ?? "—"}</td>
              <td>{subject.attendance["Ж"] ?? 0}</td>
              <td>{subject.attendance["К"] ?? 0}</td>
              {hasPeriodGrades &&
                PERIOD_KEYS.map((period) => <td key={period}>{subject.period_grades?.[period] ?? "—"}</td>)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>{t("overall")}</td>
            <td>{summary.subjects.reduce((sum, subject) => sum + subject.grades_count, 0)}</td>
            <td>{summary.overall_average?.toFixed(1) ?? "—"}</td>
            <td>{summary.attendance["Ж"] ?? 0}</td>
            <td>{summary.attendance["К"] ?? 0}</td>
            {hasPeriodGrades && PERIOD_KEYS.map((period) => <td key={period} />)}
          </tr>
        </tfoot>
      </table>

      <div className={scss.signatures}>
        <span>{t("classTeacher")}</span>
        <span>{t("director")}</span>
      </div>
    </section>
  );
}
