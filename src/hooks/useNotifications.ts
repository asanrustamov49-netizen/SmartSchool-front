import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/apis/notifications.api";
import { getNotificationCategory } from "@/lib/preferences";
import { usePreferences } from "./usePreferences";

const notificationsQueryKey = ["notifications"];

// «Последние события» на главной.
export const HOME_EVENTS_LIMIT = 5;
// Список в колокольчике.
export const MENU_NOTIFICATIONS_LIMIT = 20;

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

// Уведомления без скрытых в настройках категорий.
export function useVisibleNotifications() {
  const { preferences } = usePreferences();
  const hidden = preferences.hiddenNotifications;
  return (notifications: Notification[]) =>
    notifications.filter((notification) => !hidden.includes(getNotificationCategory(notification.link)));
}

// Число непрочитанных для значка. Если часть категорий скрыта, backend их не различает —
// считаем по последним уведомлениям из списка.
export function useVisibleUnreadCount() {
  const { preferences } = usePreferences();
  const isFiltered = preferences.hiddenNotifications.length > 0;
  const countQuery = useQuery({ ...unreadNotificationsCountQuery, enabled: !isFiltered });
  const listQuery = useNotifications(MENU_NOTIFICATIONS_LIMIT, isFiltered);
  const filterVisible = useVisibleNotifications();

  if (!isFiltered) {
    return countQuery.data?.unread ?? 0;
  }
  return filterVisible(listQuery.data ?? []).filter((notification) => !notification.is_read).length;
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
