import { queryOptions, useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "@/apis/announcements.api";
import { getDashboardStats, getPerformance, type PerformancePeriod } from "@/apis/dashboard.api";
import { getSchoolRating } from "@/apis/ratings.api";

// Сколько записей показывают панели главной. Те же числа использует предзагрузка (usePrefetchHome).
export const HOME_ANNOUNCEMENTS_LIMIT = 3;
export const HOME_RATING_LIMIT = 5;

// Описания запросов вынесены, чтобы хук и предзагрузка главной брали один и тот же ключ.
export const dashboardStatsQuery = queryOptions({
  queryKey: ["dashboard", "stats"],
  queryFn: getDashboardStats,
});

export function performanceQuery(period: PerformancePeriod) {
  return queryOptions({
    queryKey: ["dashboard", "performance", period],
    queryFn: () => getPerformance(period),
  });
}

export function schoolRatingQuery(limit: number) {
  return queryOptions({
    queryKey: ["ratings", "school", limit],
    queryFn: () => getSchoolRating(limit),
  });
}

export function latestAnnouncementsQuery(limit: number) {
  return queryOptions({
    queryKey: ["announcements", "latest", limit],
    queryFn: () => getAnnouncements(limit),
  });
}

export function useDashboardStats() {
  return useQuery(dashboardStatsQuery);
}

// Пока грузится другой период, на графике остаются прежние данные — без мигания.
export function usePerformance(period: PerformancePeriod) {
  return useQuery({ ...performanceQuery(period), placeholderData: (previous) => previous });
}

export function useSchoolRating(limit: number) {
  return useQuery(schoolRatingQuery(limit));
}

export function useLatestAnnouncements(limit: number) {
  return useQuery(latestAnnouncementsQuery(limit));
}
