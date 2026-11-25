"use client";

import { Award, BookOpen, CircleCheck, UserPlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { useSchoolRating } from "@/hooks/useDashboard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useRouter } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import dynamic from "next/dynamic";
import { XpRing } from "./XpRing";
import scss from "./home.module.scss";

// Один запрос рейтинга школы вместо отдельного запроса на каждого ребёнка (без N+1).
// Максимум, который разрешает backend для /ratings/school.
// Форма с проверкой (zod) нужна только при добавлении ребёнка — грузится по нажатию,
// а не вместе с главной у всех пользователей.
const AddChildForm = dynamic(() => import("./AddChildForm").then((module) => module.AddChildForm));

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
// Привязка хранится на backend (parent_students), поэтому после выхода и нового входа дети остаются.
export function ParentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.parent");
  const tLink = useTranslations("parentLink");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const children = currentUser.children ?? [];
  const { selectedChildId, selectChild } = useSelectedChild(children);
  const [formOpen, setFormOpen] = useState(false);
  const [addedChildName, setAddedChildName] = useState<string | null>(null);
  const ratingQuery = useSchoolRating(SCHOOL_RATING_LIMIT);
  const ratingItems = ratingQuery.data?.items ?? [];
  const leaderXp = ratingItems[0]?.xp ?? 0;
  const showForm = formOpen || children.length === 0;

  const handleChildAdded = (childId: number, fullName: string) => {
    selectChild(childId);
    setAddedChildName(fullName);
    setFormOpen(false);
  };

  const openChildDiary = (childId: number) => {
    selectChild(childId);
    router.push("/diary");
  };

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Users size={20} aria-hidden="true" />
          <h2>{t("children")}</h2>
        </div>
        {children.length > 0 && !formOpen && (
          <button
            type="button"
            className={adminStyles.secondaryButton}
            onClick={() => {
              setAddedChildName(null);
              setFormOpen(true);
            }}
          >
            <UserPlus size={16} aria-hidden="true" />
            {tLink("addChild")}
          </button>
        )}
      </div>

      {addedChildName && (
        <p className={cn(adminStyles.notice, scss.addChildSuccess)} role="status">
          <CircleCheck size={16} aria-hidden="true" />
          {tLink("added", { name: addedChildName })}
        </p>
      )}

      {showForm && (
        <div className={scss.addChildPanel}>
          {children.length === 0 && <p className={scss.addChildLead}>{t("noChildren")}</p>}
          <AddChildForm
            onAdded={handleChildAdded}
            onCancel={children.length > 0 ? () => setFormOpen(false) : undefined}
          />
        </div>
      )}

      {ratingQuery.isError && children.length > 0 && (
        <DataState
          status="error"
          message={handleApiError(ratingQuery.error, tApiErrors)}
          onRetry={() => ratingQuery.refetch()}
        />
      )}

      {children.length > 0 && (
        <ul className={scss.childGrid}>
          {children.map((child) => {
            const rating = ratingItems.find((item) => item.student_id === child.id);
            const isSelected = child.id === selectedChildId && children.length > 1;

            return (
              <li key={child.id} className={cn(scss.childCard, isSelected && scss.childCardActive)}>
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

                <button
                  type="button"
                  className={scss.childAction}
                  onClick={() => openChildDiary(child.id)}
                >
                  <BookOpen size={16} aria-hidden="true" />
                  {tLink("openDiary")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
