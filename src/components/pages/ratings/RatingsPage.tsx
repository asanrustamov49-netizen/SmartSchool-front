"use client";

import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import type { RatingItem } from "@/apis/ratings.api";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { useSchoolRating } from "@/hooks/useDashboard";
import { useClassRating } from "@/hooks/useRatings";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./ratings.module.scss";

const SCHOOL_RATING_LIMIT = 100;

type ClassOption = { id: number; name: string };

// Ученик видит рейтинг своего класса, родитель — классов своих детей.
function getClassOptions(user: CurrentUser): ClassOption[] {
  const options: ClassOption[] = [];

  const addOption = (classId: number | null, className: string | null) => {
    if (classId !== null && !options.some((option) => option.id === classId)) {
      options.push({ id: classId, name: className ?? "—" });
    }
  };

  if (user.student) {
    addOption(user.student.class_id, user.student.class_name);
  }

  for (const child of user.children ?? []) {
    addOption(child.class_id, child.class_name);
  }

  return options;
}

function getOwnStudentIds(user: CurrentUser) {
  const ids = new Set<number>();

  if (user.student) {
    ids.add(user.student.student_id);
  }

  for (const child of user.children ?? []) {
    ids.add(child.id);
  }

  return ids;
}

export function RatingsPage() {
  const t = useTranslations("ratings");
  const tApiErrors = useTranslations("apiErrors");
  const currentUserQuery = useCurrentUser();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const schoolRatingQuery = useSchoolRating(SCHOOL_RATING_LIMIT);
  const classRatingQuery = useClassRating(selectedClassId);

  const user = currentUserQuery.data;
  const classOptions = user ? getClassOptions(user) : [];
  const ownStudentIds = user ? getOwnStudentIds(user) : new Set<number>();
  const ratingQuery = selectedClassId === null ? schoolRatingQuery : classRatingQuery;

  const renderRows = (items: RatingItem[]) => {
    const maxXp = Math.max(...items.map((item) => item.xp), 1);

    return (
      <ol className={styles.list}>
        {items.map((item) => (
          <li
            key={item.student_id}
            className={cn(styles.row, ownStudentIds.has(item.student_id) && styles.rowOwn)}
          >
            <span className={cn(styles.rank, item.rank <= 3 && styles[`rank${item.rank}`])}>
              {item.rank}
            </span>
            <span className={styles.name}>
              <strong>{item.full_name}</strong>
              {item.class_name && <small>{item.class_name}</small>}
            </span>
            <span className={styles.bar} aria-hidden="true">
              <span style={{ width: `${(item.xp / maxXp) * 100}%` }} />
            </span>
            <span className={styles.xp}>{t("xp", { count: item.xp })}</span>
          </li>
        ))}
      </ol>
    );
  };

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

    return renderRows(ratingQuery.data.items);
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

      <section className={adminStyles.card}>
        <div className={styles.tabs} role="tablist" aria-label={t("scope")}>
          <button
            type="button"
            role="tab"
            aria-selected={selectedClassId === null}
            className={cn(styles.tab, selectedClassId === null && styles.tabActive)}
            onClick={() => setSelectedClassId(null)}
          >
            <Trophy size={15} aria-hidden="true" />
            {t("school")}
          </button>
          {classOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={selectedClassId === option.id}
              className={cn(styles.tab, selectedClassId === option.id && styles.tabActive)}
              onClick={() => setSelectedClassId(option.id)}
            >
              {t("class", { name: option.name })}
            </button>
          ))}
        </div>
        {renderContent()}
      </section>
    </div>
  );
}
