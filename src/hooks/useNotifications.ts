import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/apis/notifications.api";

const notificationsQueryKey = ["notifications"];

// «Последние события» на главной.
export const HOME_EVENTS_LIMIT = 5;

export function notificationsQuery(limit: number) {
  return queryOptions({
    queryKey: [...notificationsQueryKey, "list", limit],
    queryFn: () => getNotifications(limit),
  });
}

export const unreadNotificationsCountQuery = queryOptions({
  queryKey: [...notificationsQueryKey, "unread-count"],
  queryFn: getUnreadNotificationsCount,
});

export function useNotifications(limit: number, enabled: boolean) {
  return useQuery({ ...notificationsQuery(limit), enabled });
}

export function useUnreadNotificationsCount() {
  return useQuery(unreadNotificationsCountQuery);
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
}
