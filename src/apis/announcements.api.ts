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
  // Для кого объявление; null — для всех.
  audience: AudienceGroup[] | null;
  created_by: number | null;
  created_at: string;
};

// Группы получателей (backend: AUDIENCE_GROUPS). Классный руководитель входит в TEACHER.
export const AUDIENCE_GROUPS = ["STUDENT", "PARENT", "TEACHER", "DEPUTY"] as const;
export type AudienceGroup = (typeof AUDIENCE_GROUPS)[number];

export async function getAnnouncements(limit: number): Promise<Announcement[]> {
  const response = await api.get<Announcement[]>("/announcements", {
    params: { limit },
  });
  return response.data;
}

export async function getAnnouncementsPage(limit: number, offset: number): Promise<Announcement[]> {
  const response = await api.get<Announcement[]>("/announcements", {
    params: { limit, offset },
  });
  return response.data;
}

// POST и PUT принимают multipart/form-data. PUT частичный:
// пустые поля не отправляются и не стирают сохранённые значения.
export type AnnouncementInput = {
  title: string;
  body: string;
  event_date: string;
  // Пустой список — для всех.
  audience: AudienceGroup[];
  image: File | null;
};

function toFormData(data: AnnouncementInput) {
  const formData = new FormData();
  formData.append("title", data.title.trim());

  if (data.body.trim() !== "") {
    formData.append("body", data.body.trim());
  }

  if (data.event_date !== "") {
    formData.append("event_date", data.event_date);
  }

  // "ALL" нужен и при редактировании: пустое поле PUT оставил бы старую аудиторию.
  formData.append("audience", data.audience.length === 0 ? "ALL" : data.audience.join(","));

  if (data.image) {
    formData.append("image", data.image);
  }

  return formData;
}

const multipartHeaders = { "Content-Type": "multipart/form-data" };

export async function createAnnouncement(data: AnnouncementInput): Promise<Announcement> {
  const response = await api.post<Announcement>("/announcements", toFormData(data), {
    headers: multipartHeaders,
  });
  return response.data;
}

export async function updateAnnouncement(
  announcementId: number,
  data: AnnouncementInput,
): Promise<Announcement> {
  const response = await api.put<Announcement>(
    `/announcements/${announcementId}`,
    toFormData(data),
    { headers: multipartHeaders },
  );
  return response.data;
}

export async function deleteAnnouncement(announcementId: number) {
  await api.delete(`/announcements/${announcementId}`);
}
