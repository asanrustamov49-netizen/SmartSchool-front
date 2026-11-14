import { BookOpen, School } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { MetricCard } from "./MetricCard";
import scss from "./home.module.scss";

// Данные учителя (classes_led, assignments) приходят в /me, отдельных запросов нет.
export function TeacherDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.teacher");
  const classesLed = currentUser.classes_led ?? [];
  const assignments = currentUser.assignments ?? [];

  return (
    <>
      <section className={scss.metricsGrid} aria-label={t("title")}>
        <MetricCard icon={School} value={classesLed.length} label={t("classesLed")} tone="violet" />
        <MetricCard icon={BookOpen} value={assignments.length} label={t("assignments")} tone="blue" />
      </section>

      <div className={scss.panelsGrid}>
        <section className={scss.panel}>
          <div className={scss.panelHeading}>
            <div className={scss.headingTitle}>
              <School size={20} aria-hidden="true" />
              <h2>{t("classesLed")}</h2>
            </div>
          </div>
          {classesLed.length === 0 ? (
            <DataState status="empty" message={t("noClassesLed")} />
          ) : (
            <ul className={scss.list}>
              {classesLed.map((schoolClass) => (
                <li key={schoolClass.id} className={scss.listRow}>
                  <strong>{schoolClass.name ?? "—"}</strong>
                  <span>{schoolClass.academic_year}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={scss.panel}>
          <div className={scss.panelHeading}>
            <div className={scss.headingTitle}>
              <BookOpen size={20} aria-hidden="true" />
              <h2>{t("assignments")}</h2>
            </div>
          </div>
          {assignments.length === 0 ? (
            <DataState status="empty" message={t("noAssignments")} />
          ) : (
            <ul className={scss.list}>
              {assignments.map((assignment) => (
                <li key={assignment.id} className={scss.listRow}>
                  <strong>{assignment.subject_name}</strong>
                  <span>
                    {assignment.class_name ?? "—"} · {assignment.academic_year}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
