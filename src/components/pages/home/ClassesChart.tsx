"use client";

import { ChartNoAxesColumn } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { getClassName } from "@/apis/classes.api";
import { DataState } from "@/components/ui/DataState";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { handleApiError } from "@/lib/errorHandler";
import scss from "./home.module.scss";

// График директора: число активных учеников в каждом классе.
// Считается из /classes/ и /students/ — те же запросы и кэш, что в разделах управления.
export function ClassesChart() {
  const t = useTranslations("dashboard.classesChart");
  const tApiErrors = useTranslations("apiErrors");
  const classesQuery = useClasses();
  const studentsQuery = useStudents();

  const renderContent = () => {
    if (classesQuery.isPending || studentsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (classesQuery.isError || studentsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(classesQuery.error ?? studentsQuery.error, tApiErrors)}
          onRetry={() => {
            classesQuery.refetch();
            studentsQuery.refetch();
          }}
        />
      );
    }

    if (classesQuery.data.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    const counts = new Map<number, number>();
    for (const student of studentsQuery.data) {
      if (student.is_active && student.class_id !== null) {
        counts.set(student.class_id, (counts.get(student.class_id) ?? 0) + 1);
      }
    }

    const bars = classesQuery.data.map((schoolClass) => ({
      id: schoolClass.id,
      name: getClassName(schoolClass),
      count: counts.get(schoolClass.id) ?? 0,
    }));
    const maxCount = Math.max(...bars.map((bar) => bar.count), 1);

    return (
      <ul className={scss.chart} aria-label={t("title")}>
        {bars.map((bar, index) => (
          <li key={bar.id} className={scss.chartColumn}>
            <span className={scss.chartValue}>{bar.count}</span>
            <span className={scss.chartTrack}>
              <span
                className={scss.chartBar}
                style={
                  {
                    "--bar-height": `${Math.max((bar.count / maxCount) * 100, 4)}%`,
                    "--bar-delay": `${index * 60}ms`,
                  } as CSSProperties
                }
                title={t("tooltip", { name: bar.name, count: bar.count })}
              />
            </span>
            <span className={scss.chartLabel}>{bar.name}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <ChartNoAxesColumn size={20} aria-hidden="true" />
          <h2>{t("title")}</h2>
        </div>
        <span className={scss.panelMeta}>{t("subtitle")}</span>
      </div>
      {renderContent()}
    </section>
  );
}
