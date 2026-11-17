"use client";

import { GraduationCap, Medal, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useDashboardStats } from "@/hooks/useDashboard";
import { handleApiError } from "@/lib/errorHandler";
import { ClassesChart } from "./ClassesChart";
import { MetricCard } from "./MetricCard";
import { SetupChecklist } from "./SetupChecklist";
import scss from "./home.module.scss";

export function AdminDashboard() {
  const t = useTranslations("dashboard.metrics");
  const tApiErrors = useTranslations("apiErrors");
  const statsQuery = useDashboardStats();

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
    <>
      <SetupChecklist stats={stats} />
      <section className={scss.metricsGrid} aria-label={t("title")}>
        <MetricCard icon={Users} value={stats.students} label={t("students")} tone="blue" />
        <MetricCard icon={UserRound} value={stats.teachers} label={t("teachers")} tone="violet" />
        <MetricCard icon={GraduationCap} value={stats.classes} label={t("classes")} tone="sky" />
        <MetricCard
          icon={Medal}
          value={stats.olympiad_candidates}
          label={t("olympiadCandidates")}
          tone="amber"
        />
      </section>
      <ClassesChart />
    </>
  );
}
