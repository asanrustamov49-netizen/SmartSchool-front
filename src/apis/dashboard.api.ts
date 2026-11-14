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
