import api from "@/lib/axios";

// GET /dashboard/stats. В openapi.json схема ответа пустая,
// поля взяты из backend: mysite/api/public.py (dashboard_stats).
// olympiad_candidates — число учеников со статусом SELECTED, а не победителей.
export type DashboardStats = {
  students: number;
  teachers: number;
  classes: number;
  olympiad_candidates: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard/stats");
  return response.data;
}

// GET /dashboard/performance (backend: mysite/api/public.py, dashboard_performance).
// week и month — точки по дням, year — по месяцам (date — первое число месяца).
// percent — средний балл в процентах (5 → 100), null — в этот день оценок не было.
export type PerformancePeriod = "week" | "month" | "year";

export type PerformancePoint = {
  date: string;
  average: number | null;
  percent: number | null;
  grades_count: number;
  attendance_percent: number | null;
};

export async function getPerformance(period: PerformancePeriod): Promise<PerformancePoint[]> {
  const response = await api.get<{ period: PerformancePeriod; points: PerformancePoint[] }>(
    "/dashboard/performance",
    { params: { period } },
  );
  return response.data.points;
}
