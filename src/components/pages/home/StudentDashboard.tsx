import {
  Award,
  ChartNoAxesCombined,
  Crown,
  Medal,
  School,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { MetricCard } from "./MetricCard";
import scss from "./home.module.scss";

function formatRank(rank: number | null) {
  return rank === null ? "—" : `#${rank}`;
}

// Типы значков и их иконки описаны в FRONTEND.md (badge_type → icon_name).
const BADGE_ICONS: Record<string, LucideIcon> = {
  SUBJECT_LEADER: Crown,
  PARALLEL_CHAMP: Medal,
  PERFECT_ATTENDANCE: Zap,
  OLYMPIAD_CANDIDATE: Star,
};

const KNOWN_BADGES = Object.keys(BADGE_ICONS);

// Рейтинг ученика (XP, места, значки) приходит в /me в поле student.
export function StudentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.student");
  const standing = currentUser.student;

  if (!standing) {
    return <DataState status="empty" message={t("noStanding")} />;
  }

  const maxSubjectXp = Math.max(...standing.subjects.map((subject) => subject.xp), 1);

  return (
    <>
      <section className={scss.metricsGrid} aria-label={t("title")}>
        <MetricCard icon={Sparkles} value={standing.total_xp} label={t("totalXp")} tone="violet" />
        <MetricCard
          icon={School}
          value={formatRank(standing.class_rank)}
          label={t("classRank")}
          tone="blue"
        />
        <MetricCard
          icon={ChartNoAxesCombined}
          value={formatRank(standing.parallel_rank)}
          label={t("parallelRank")}
          tone="sky"
        />
        <MetricCard
          icon={Award}
          value={formatRank(standing.school_rank)}
          label={t("schoolRank")}
          tone="amber"
        />
      </section>

      <div className={scss.panelsGrid}>
        <section className={scss.panel}>
          <div className={scss.panelHeading}>
            <div className={scss.headingTitle}>
              <Sparkles size={20} aria-hidden="true" />
              <h2>{t("subjects")}</h2>
            </div>
            {standing.class_name && (
              <span className={scss.panelMeta}>{standing.class_name}</span>
            )}
          </div>
          {standing.subjects.length === 0 ? (
            <DataState status="empty" message={t("noSubjects")} />
          ) : (
            <ul className={scss.list}>
              {standing.subjects.map((subject) => (
                <li key={subject.subject_id} className={scss.rankingRow}>
                  <span className={scss.rankNumber}>{formatRank(subject.class_rank).replace("#", "")}</span>
                  <div className={scss.rankingName}>
                    <strong>{subject.subject_name ?? "—"}</strong>
                    <span className={scss.rankingBar} aria-hidden="true">
                      <span style={{ width: `${Math.round((subject.xp / maxSubjectXp) * 100)}%` }} />
                    </span>
                  </div>
                  <span>{t("classRankShort")}</span>
                  <b>{subject.xp} XP</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={scss.panel}>
          <div className={scss.panelHeading}>
            <div className={scss.headingTitle}>
              <Award size={20} aria-hidden="true" />
              <h2>{t("badges")}</h2>
            </div>
          </div>
          {standing.badges.length === 0 ? (
            <DataState status="empty" message={t("noBadges")} />
          ) : (
            <ul className={scss.badgeGrid}>
              {standing.badges.map((badge, index) => {
                const Icon = BADGE_ICONS[badge.badge_type] ?? Award;
                const label = KNOWN_BADGES.includes(badge.badge_type)
                  ? t(`badgeTypes.${badge.badge_type}`)
                  : badge.badge_type;

                return (
                  <li key={`${badge.badge_type}-${badge.subject_id}-${index}`} className={scss.badge}>
                    <span className={scss.badgeIcon}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <strong>{label}</strong>
                    {badge.subject_name && <span>{badge.subject_name}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
