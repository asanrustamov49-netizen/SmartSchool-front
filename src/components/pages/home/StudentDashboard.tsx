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
import type { CSSProperties } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { useSchoolRating } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { XpRing } from "./XpRing";
import scss from "./home.module.scss";

// Типы значков и их иконки описаны в FRONTEND.md (badge_type → icon_name).
const BADGE_ICONS: Record<string, LucideIcon> = {
  SUBJECT_LEADER: Crown,
  PARALLEL_CHAMP: Medal,
  PERFECT_ATTENDANCE: Zap,
  OLYMPIAD_CANDIDATE: Star,
};

// Порядок показа: все четыре значка видны всегда — полученные цветные, остальные серые
// с подсказкой, как их получить.
const BADGE_TYPES = ["SUBJECT_LEADER", "PARALLEL_CHAMP", "PERFECT_ATTENDANCE", "OLYMPIAD_CANDIDATE"];

// Рейтинг ученика (XP, места, значки) приходит в /me в поле student.
export function StudentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.student");
  const standing = currentUser.student;
  // Тот же запрос, что у панели рейтинга школы: данные берутся из кэша TanStack Query.
  const schoolRatingQuery = useSchoolRating(5);

  if (!standing) {
    return <DataState status="empty" message={t("noStanding")} />;
  }

  const maxSubjectXp = Math.max(...standing.subjects.map((subject) => subject.xp), 1);
  const leaderXp = schoolRatingQuery.data?.items[0]?.xp;

  // Показываются только места, которые вернул backend (null — места нет).
  const ranks = [
    { key: "classRank", value: standing.class_rank, icon: School },
    { key: "parallelRank", value: standing.parallel_rank, icon: ChartNoAxesCombined },
    { key: "schoolRank", value: standing.school_rank, icon: Award },
  ].filter((rank): rank is { key: string; value: number; icon: LucideIcon } => rank.value !== null);

  const getLeaderText = () => {
    if (leaderXp === undefined) {
      return t("progressHint");
    }

    if (standing.total_xp >= leaderXp) {
      return t("youAreLeader");
    }

    return t("toLeader", { count: leaderXp - standing.total_xp });
  };

  return (
    <>
      <section className={scss.progressGrid} aria-label={t("title")}>
        <article className={scss.progressCard}>
          <XpRing value={standing.total_xp} max={leaderXp ?? standing.total_xp}>
            <strong>
              <span
                className={scss.metricCounter}
                style={{ "--metric-target": standing.total_xp } as CSSProperties}
                aria-hidden="true"
              />
              <span className="sr-only">{standing.total_xp}</span>
            </strong>
            <span>XP</span>
          </XpRing>
          <div className={scss.progressCopy}>
            <h2>{t("totalXp")}</h2>
            <p>{getLeaderText()}</p>
          </div>
        </article>

        <article className={scss.progressCard}>
          {ranks.length === 0 ? (
            <DataState status="empty" message={t("noRanks")} />
          ) : (
            <ul className={scss.rankPodium}>
              {ranks.map((rank) => (
                <li key={rank.key} className={rank.value === 1 ? scss.rankPodiumTop : undefined}>
                  <span className={scss.rankPodiumMedal}>
                    <rank.icon size={20} aria-hidden="true" />
                  </span>
                  <strong>#{rank.value}</strong>
                  <span>{t(rank.key)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
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
                  <span className={scss.rankNumber}>{subject.class_rank ?? "·"}</span>
                  <div className={scss.rankingName}>
                    <strong>{subject.subject_name ?? "—"}</strong>
                    <span className={scss.rankingBar} aria-hidden="true">
                      <span style={{ width: `${Math.round((subject.xp / maxSubjectXp) * 100)}%` }} />
                    </span>
                  </div>
                  <span>{subject.class_rank !== null ? t("classRankShort") : ""}</span>
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
            <span className={scss.panelMeta}>
              {t("badgesCount", { count: new Set(standing.badges.map((badge) => badge.badge_type)).size })}
            </span>
          </div>
          <ul className={scss.badgeGrid}>
            {BADGE_TYPES.map((badgeType) => {
              const Icon = BADGE_ICONS[badgeType];
              const earned = standing.badges.filter((badge) => badge.badge_type === badgeType);
              const subjects = earned
                .map((badge) => badge.subject_name)
                .filter((name): name is string => Boolean(name));
              return (
                <li
                  key={badgeType}
                  className={cn(scss.badge, scss[`badge${badgeType}`], earned.length === 0 && scss.badgeLocked)}
                >
                  <span className={scss.badgeIcon}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <strong>{t(`badgeTypes.${badgeType}`)}</strong>
                  <small>{t(`badgeHints.${badgeType}`)}</small>
                  <span className={scss.badgeStatus}>
                    {earned.length === 0
                      ? t("badgeLocked")
                      : subjects.length > 0
                        ? subjects.join(", ")
                        : t("badgeEarned")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
