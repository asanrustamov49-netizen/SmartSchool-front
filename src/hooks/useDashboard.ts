import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "@/apis/announcements.api";
import { getDashboardStats, getPerformance, type PerformancePeriod } from "@/apis/dashboard.api";
import { getSchoolRating } from "@/apis/ratings.api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });
}

export function usePerformance(period: PerformancePeriod) {
  return useQuery({
    queryKey: ["dashboard", "performance", period],
    queryFn: () => getPerformance(period),
  });
}

export function useSchoolRating(limit: number) {
  return useQuery({
    queryKey: ["ratings", "school", limit],
    queryFn: () => getSchoolRating(limit),
  });
}

export function useLatestAnnouncements(limit: number) {
  return useQuery({
    queryKey: ["announcements", "latest", limit],
    queryFn: () => getAnnouncements(limit),
  });
}
