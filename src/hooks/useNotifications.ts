import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/apis/notifications.api";

const notificationsQueryKey = ["notifications"];

export function useNotifications(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: [...notificationsQueryKey, "list", limit],
    queryFn: () => getNotifications(limit),
    enabled,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: [...notificationsQueryKey, "unread-count"],
    queryFn: getUnreadNotificationsCount,
  });
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
