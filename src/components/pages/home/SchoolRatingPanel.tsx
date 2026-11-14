"use client";

import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useSchoolRating } from "@/hooks/useDashboard";
import { handleApiError } from "@/lib/errorHandler";
import scss from "./home.module.scss";

const TOP_STUDENTS_LIMIT = 5;

export function SchoolRatingPanel() {
  const t = useTranslations("dashboard.ranking");
  const tApiErrors = useTranslations("apiErrors");
  const ratingQuery = useSchoolRating(TOP_STUDENTS_LIMIT);

  const renderContent = () => {
    if (ratingQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (ratingQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(ratingQuery.error, tApiErrors)}
          onRetry={() => ratingQuery.refetch()}
        />
      );
    }

    if (ratingQuery.data.items.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    return (
      <ul className={scss.list}>
        {ratingQuery.data.items.map((item) => (
          <li key={item.student_id} className={scss.rankingRow}>
            <span className={`${scss.rankNumber} ${item.rank <= 3 ? scss[`rank${item.rank}`] : ""}`}>
              {item.rank}
            </span>
            <strong>{item.full_name}</strong>
            <span>{item.class_name ?? "—"}</span>
            <b>{item.xp} XP</b>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Trophy size={20} aria-hidden="true" />
          <h2>{t("title")}</h2>
        </div>
      </div>
      {renderContent()}
    </section>
  );
}
