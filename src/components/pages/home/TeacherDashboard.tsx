import { BookOpen, School, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser, TeacherLedClass } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { useClassStudents } from "@/hooks/useStudents";
import scss from "./home.module.scss";

// Один запрос на класс, которым руководит учитель (а не на ученика).
function LedClassCard({ schoolClass }: { schoolClass: TeacherLedClass }) {
  const t = useTranslations("dashboard.teacher");
  const studentsQuery = useClassStudents(schoolClass.id);

  return (
    <li className={scss.classCard}>
      <span className={scss.classCardName}>{schoolClass.name ?? "—"}</span>
      <span className={scss.classCardMeta}>{schoolClass.academic_year}</span>
      <span className={scss.classCardStat}>
        <Users size={16} aria-hidden="true" />
        {studentsQuery.isPending
          ? "…"
          : studentsQuery.isError
            ? t("studentsUnavailable")
            : t("studentsCount", { count: studentsQuery.data.length })}
      </span>
    </li>
  );
}

// Классы и предметы учителя приходят в /me (classes_led, assignments).
export function TeacherDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.teacher");
  const classesLed = currentUser.classes_led ?? [];
  const assignments = currentUser.assignments ?? [];

  // Предметы группируются по классу, чтобы было видно нагрузку на каждый класс.
  const subjectsByClass = new Map<string, string[]>();
  for (const assignment of assignments) {
    const className = assignment.class_name ?? "—";
    subjectsByClass.set(className, [
      ...(subjectsByClass.get(className) ?? []),
      assignment.subject_name,
    ]);
  }

  return (
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
          <ul className={scss.classCards}>
            {classesLed.map((schoolClass) => (
              <LedClassCard key={schoolClass.id} schoolClass={schoolClass} />
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
          {assignments.length > 0 && (
            <span className={scss.panelMeta}>{t("subjectsTotal", { count: assignments.length })}</span>
          )}
        </div>
        {assignments.length === 0 ? (
          <DataState status="empty" message={t("noAssignments")} />
        ) : (
          <ul className={scss.list}>
            {[...subjectsByClass.entries()].map(([className, subjects]) => (
              <li key={className} className={scss.subjectGroup}>
                <strong>{className}</strong>
                <span className={scss.subjectChips}>
                  {subjects.map((subject, index) => (
                    <span key={`${subject}-${index}`}>{subject}</span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
