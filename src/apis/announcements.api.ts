import api from "@/lib/axios";

// GET /announcements. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/announcements.py (serialize).
export type Announcement = {
  id: number;
  school_id: number;
  title: string;
  body: string | null;
  image_url: string | null;
  event_date: string | null;
  created_by: number | null;
  created_at: string;
};

export async function getAnnouncements(limit: number): Promise<Announcement[]> {
  const response = await api.get<Announcement[]>("/announcements", {
    params: { limit },
  });
  return response.data;
}
