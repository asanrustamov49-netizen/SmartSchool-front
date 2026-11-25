import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { absenceRequestsQuery } from "@/hooks/useAbsenceRequests";
import {
  HOME_ANNOUNCEMENTS_LIMIT,
  HOME_RATING_LIMIT,
  dashboardStatsQuery,
  latestAnnouncementsQuery,
  performanceQuery,
  schoolRatingQuery,
} from "@/hooks/useDashboard";
import { HOME_EVENTS_LIMIT, notificationsQuery, unreadNotificationsCountQuery } from "@/hooks/useNotifications";
import { subjectsQuery } from "@/hooks/useSubjects";
import { teachersQuery } from "@/hooks/useTeachers";
import { getRememberedRole } from "@/lib/auth";

// Главная ускоряется так: пока идёт запрос /me, данные панелей уже запрашиваются параллельно
// (по роли с прошлого входа). Без этого запросы шли волнами: сначала /me, потом панели.
// Ключи те же, что в хуках, поэтому панели не делают повторных запросов.
export function usePrefetchHome() {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  useEffect(() => {
    const role = getRememberedRole();
    if (pathname !== "/" || !role || role === "SYSTEM_ADMIN") {
      return;
    }

    void queryClient.prefetchQuery(unreadNotificationsCountQuery);
    void queryClient.prefetchQuery(notificationsQuery(HOME_EVENTS_LIMIT));
    void queryClient.prefetchQuery(latestAnnouncementsQuery(HOME_ANNOUNCEMENTS_LIMIT));
    void queryClient.prefetchQuery(schoolRatingQuery(HOME_RATING_LIMIT));
    void queryClient.prefetchQuery(dashboardStatsQuery);

    if (role === "DIRECTOR" || role === "DEPUTY") {
      void queryClient.prefetchQuery(absenceRequestsQuery("PENDING"));
      void queryClient.prefetchQuery(teachersQuery);
      void queryClient.prefetchQuery(subjectsQuery);
      void queryClient.prefetchQuery(performanceQuery("week"));
    }
    if (role === "PARENT") {
      void queryClient.prefetchQuery(absenceRequestsQuery("PENDING"));
    }
    // Только при открытии кабинета: дальше данные обновляют сами панели.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
