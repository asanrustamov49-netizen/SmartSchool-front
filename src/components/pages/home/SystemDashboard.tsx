"use client";

import { ArrowRight, GraduationCap, HeartHandshake, School, ShieldCheck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { usePlatformStats, useSystemSchools } from "@/hooks/useSystem";
import { Link } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { SchoolCard } from "../system/SchoolsPage";
import systemStyles from "../system/system.module.scss";
import { MetricCard } from "./MetricCard";
import scss from "./home.module.scss";

const RECENT_SCHOOLS_COUNT = 6;

// Главная SYSTEM_ADMIN: статистика всей платформы (GET /system/stats) и последние школы.
export function SystemDashboard() {
  const t = useTranslations("system");
  const tApiErrors = useTranslations("apiErrors");
  const statsQuery = usePlatformStats();
  const schoolsQuery = useSystemSchools();

  const renderStats = () => {
    if (statsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (statsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(statsQuery.error, tApiErrors)}
          onRetry={() => statsQuery.refetch()}
        />
      );
    }

    const stats = statsQuery.data;
    return (
      <section className={scss.metricsGrid} aria-label={t("statsTitle")}>
        <MetricCard
          icon={School}
          value={stats.schools}
          label={t("platform.schools", { active: stats.active_schools })}
          tone="blue"
        />
        <MetricCard icon={GraduationCap} value={stats.students} label={t("stats.students")} tone="violet" />
        <MetricCard icon={UserRound} value={stats.teachers} label={t("stats.teachers")} tone="sky" />
        <MetricCard
          icon={ShieldCheck}
          value={stats.directors + stats.deputies}
          label={t("platform.admins", { directors: stats.directors, deputies: stats.deputies })}
          tone="amber"
        />
      </section>
    );
  };

  const renderSchools = () => {
    if (schoolsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (schoolsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(schoolsQuery.error, tApiErrors)}
          onRetry={() => schoolsQuery.refetch()}
        />
      );
    }

    if (schoolsQuery.data.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    const recentSchools = [...schoolsQuery.data]
      .sort((first, second) => second.created_at.localeCompare(first.created_at))
      .slice(0, RECENT_SCHOOLS_COUNT);

    return (
      <div className={systemStyles.schoolGrid}>
        {recentSchools.map((school) => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </div>
    );
  };

  return (
    <>
      {renderStats()}
      {statsQuery.data && (
        <p className={scss.platformNote}>
          <HeartHandshake size={16} aria-hidden="true" />
          {t("platform.parents", { count: statsQuery.data.parents })}
        </p>
      )}
      <section className={scss.panel}>
        <div className={scss.panelHeading}>
          <div className={scss.headingTitle}>
            <School size={20} aria-hidden="true" />
            <h2>{t("recentSchools")}</h2>
          </div>
          <Link href="/system/schools" className={scss.panelLink}>
            {t("allSchools")}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {renderSchools()}
      </section>
    </>
  );
}
