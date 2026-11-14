import { Award, ChartNoAxesCombined, School, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import { MetricCard } from "./MetricCard";
import scss from "./home.module.scss";

function formatRank(rank: number | null) {
  return rank === null ? "—" : `#${rank}`;
}

// Рейтинг ученика (XP и места) приходит в /me в поле student.
export function StudentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.student");
  const standing = currentUser.student;

  if (!standing) {
    return <DataState status="empty" message={t("noStanding")} />;
  }

  return (
    <>
      <section className={scss.metricsGrid} aria-label={t("title")}>
        <MetricCard icon={Sparkles} value={standing.total_xp} label={t("totalXp")} />
        <MetricCard
          icon={School}
          value={formatRank(standing.class_rank)}
          label={t("classRank")}
        />
        <MetricCard
          icon={ChartNoAxesCombined}
          value={formatRank(standing.parallel_rank)}
          label={t("parallelRank")}
        />
        <MetricCard
          icon={Award}
          value={formatRank(standing.school_rank)}
          label={t("schoolRank")}
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
                <li key={subject.subject_id} className={scss.listRow}>
                  <strong>{subject.subject_name ?? "—"}</strong>
                  <span>
                    {subject.xp} XP · {t("classRankShort")} {formatRank(subject.class_rank)}
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
