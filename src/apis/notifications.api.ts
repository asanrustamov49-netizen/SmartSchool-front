import api from "@/lib/axios";

// Схемы ответов в openapi.json пустые, поля взяты из backend: mysite/api/notifications.py.
export type Notification = {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type UnreadCount = {
  unread: number;
};

export async function getNotifications(limit: number): Promise<Notification[]> {
  const response = await api.get<Notification[]>("/notifications", {
    params: { limit },
  });
  return response.data;
}

export async function getUnreadNotificationsCount(): Promise<UnreadCount> {
  const response = await api.get<UnreadCount>("/notifications/unread-count");
  return response.data;
}

export async function markAllNotificationsRead() {
  await api.post("/notifications/read-all");
}

export async function markNotificationRead(notificationId: number) {
  await api.post(`/notifications/${notificationId}/read`);
}
