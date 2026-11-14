import { Award, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { useSchoolRating } from "@/hooks/useDashboard";
import { handleApiError } from "@/lib/errorHandler";
import { XpRing } from "./XpRing";
import scss from "./home.module.scss";

// Один запрос рейтинга школы вместо отдельного запроса на каждого ребёнка (без N+1).
// Максимум, который разрешает backend для /ratings/school.
const SCHOOL_RATING_LIMIT = 1000;

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Список детей приходит в /me (children), их XP и место в школе — из /ratings/school.
export function ParentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.parent");
  const tApiErrors = useTranslations("apiErrors");
  const children = currentUser.children ?? [];
  const ratingQuery = useSchoolRating(SCHOOL_RATING_LIMIT);
  const ratingItems = ratingQuery.data?.items ?? [];
  const leaderXp = ratingItems[0]?.xp ?? 0;

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Users size={20} aria-hidden="true" />
          <h2>{t("children")}</h2>
        </div>
      </div>
      {ratingQuery.isError && children.length > 0 && (
        <DataState
          status="error"
          message={handleApiError(ratingQuery.error, tApiErrors)}
          onRetry={() => ratingQuery.refetch()}
        />
      )}
      {children.length === 0 ? (
        <DataState status="empty" message={t("noChildren")} />
      ) : (
        <ul className={scss.childGrid}>
          {children.map((child) => {
            const rating = ratingItems.find((item) => item.student_id === child.id);

            return (
              <li key={child.id} className={scss.childCard}>
                <div className={scss.childHead}>
                  <span className={scss.childAvatar} aria-hidden="true">
                    {getInitials(child.full_name)}
                  </span>
                  <span>
                    <strong>{child.full_name}</strong>
                    <span>{child.class_name ?? t("noClass")}</span>
                  </span>
                </div>

                {ratingQuery.isPending ? (
                  <DataState status="loading" />
                ) : rating ? (
                  <div className={scss.childProgress}>
                    <XpRing value={rating.xp} max={leaderXp} size={92}>
                      <strong>{rating.xp}</strong>
                      <span>XP</span>
                    </XpRing>
                    <div className={scss.childRank}>
                      <Award size={18} aria-hidden="true" />
                      <strong>#{rating.rank}</strong>
                      <span>{t("schoolRank")}</span>
                    </div>
                  </div>
                ) : (
                  <p className={scss.childEmpty}>{t("noRating")}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
