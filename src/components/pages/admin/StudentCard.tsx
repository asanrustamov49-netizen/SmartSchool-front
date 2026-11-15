"use client";

import { Award, Crown, Medal, Star, Trophy, X, Zap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useStudentHistory, useStudentProfile } from "@/hooks/useStudents";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import styles from "./admin.module.scss";
import cardStyles from "./studentCard.module.scss";

// Значки и их иконки — как на главной ученика (FRONTEND.md: badge_type → icon_name).
const BADGE_ICONS: Record<string, LucideIcon> = {
  SUBJECT_LEADER: Crown,
  PARALLEL_CHAMP: Medal,
  PERFECT_ATTENDANCE: Zap,
  OLYMPIAD_CANDIDATE: Star,
};

type StudentCardProps = {
  studentId: number;
  onClose: () => void;
};

// Карточка ученика для администрации: XP и места (/profiles/students/{id})
// и классы по учебным годам (/students/{id}/history).
export function StudentCard({ studentId, onClose }: StudentCardProps) {
  const t = useTranslations("studentCard");
  const tBadges = useTranslations("dashboard.student.badgeTypes");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const profileQuery = useStudentProfile(studentId);
  const historyQuery = useStudentHistory(studentId);

  const renderProfile = () => {
    if (profileQuery.isPending) {
      return <DataState status="loading" />;
    }
    if (profileQuery.isError) {
      return <DataState
          status="error"
          message={handleApiError(profileQuery.error, tApiErrors)}
          onRetry={() => profileQuery.refetch()}
        />;
    }

    const profile = profileQuery.data;
    const ranks = [
      { label: t("classRank"), value: profile.class_rank },
      { label: t("parallelRank"), value: profile.parallel_rank },
      { label: t("schoolRank"), value: profile.school_rank },
    ];

    return (
      <>
        <div className={cardStyles.stats}>
          <span className={cardStyles.xp}>
            <Trophy size={18} aria-hidden="true" />
            <strong>{profile.total_xp}</strong>
            XP
          </span>
          {ranks.map((rank) => (
            <span key={rank.label}>
              <strong>{rank.value !== null ? `#${rank.value}` : "—"}</strong>
              {rank.label}
            </span>
          ))}
        </div>

        {profile.subjects.length > 0 && (
          <ul className={cardStyles.subjects}>
            {[...profile.subjects]
              .sort((first, second) => second.xp - first.xp)
              .map((subject) => (
                <li key={subject.subject_id}>
                  <span>{subject.subject_name ?? "—"}</span>
                  <strong>{subject.xp} XP</strong>
                </li>
              ))}
          </ul>
        )}

        {profile.badges.length > 0 && (
          <ul className={cardStyles.badges}>
            {profile.badges.map((badge, index) => {
              const Icon = BADGE_ICONS[badge.badge_type] ?? Award;
              const label = badge.badge_type in BADGE_ICONS ? tBadges(badge.badge_type) : badge.badge_type;
              return (
                <li key={`${badge.badge_type}-${badge.subject_id}-${index}`}>
                  <Icon size={15} aria-hidden="true" />
                  {label}
                  {badge.subject_name ? ` · ${badge.subject_name}` : ""}
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  };

  const renderHistory = () => {
    if (historyQuery.isPending) {
      return <DataState status="loading" />;
    }
    if (historyQuery.isError) {
      return <DataState
          status="error"
          message={handleApiError(historyQuery.error, tApiErrors)}
          onRetry={() => historyQuery.refetch()}
        />;
    }
    if (historyQuery.data.history.length === 0) {
      return <DataState status="empty" message={t("noHistory")} />;
    }

    return (
      <ol className={cardStyles.timeline}>
        {[...historyQuery.data.history].reverse().map((item) => (
          <li key={`${item.academic_year}-${item.class_id}`} className={cn(item.status === "ACTIVE" && cardStyles.current)}>
            <strong>{item.class_name}</strong>
            <span>{item.academic_year}</span>
            <span className={cardStyles.status}>
              {item.status === "ACTIVE" ? t("statusActive") : t("statusCompleted")}
            </span>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{profileQuery.data?.full_name ?? historyQuery.data?.full_name ?? "…"}</h2>
        <button type="button" className={styles.iconButton} aria-label={tForm("close")} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={cardStyles.layout}>
        <div>
          <h3 className={cardStyles.subtitle}>{t("progress")}</h3>
          {renderProfile()}
        </div>
        <div>
          <h3 className={cardStyles.subtitle}>{t("history")}</h3>
          {renderHistory()}
        </div>
      </div>
    </section>
  );
}
