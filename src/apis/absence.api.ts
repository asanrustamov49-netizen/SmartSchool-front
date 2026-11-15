import api from "@/lib/axios";

// Поля взяты из backend: mysite/api/absence_requests.py (serialize, absence_status).

export type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type AbsenceRequest = {
  id: number;
  student_id: number;
  student_name: string | null;
  parent_id: number;
  parent_name: string | null;
  class_id: number;
  class_name: string | null;
  target_date: string;
  reason: string;
  comment: string | null;
  status: AbsenceStatus;
  request_time: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_comment: string | null;
};

// Правила подачи: на сегодня — только до deadline (08:00), вперёд — не больше max_days_ahead.
export type AbsenceRules = {
  server_time: string;
  deadline: string;
  is_open_for_today: boolean;
  can_submit: boolean;
  max_days_ahead: number;
};

// Схема AbsenceRequestCreate: reason 2–100 символов, comment до 1000.
export type AbsenceRequestCreate = {
  student_id: number;
  target_date: string;
  reason: string;
  comment: string | null;
};

export async function getAbsenceRequests(status: AbsenceStatus | null): Promise<AbsenceRequest[]> {
  const response = await api.get<AbsenceRequest[]>("/absence-requests", {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function getAbsenceRules(): Promise<AbsenceRules> {
  const response = await api.get<AbsenceRules>("/absence-requests/status");
  return response.data;
}

export async function createAbsenceRequest(data: AbsenceRequestCreate) {
  await api.post("/absence-requests", data);
}

// Одобрить или отклонить может только классный руководитель этого класса.
export async function reviewAbsenceRequest(
  requestId: number,
  decision: "approve" | "reject",
  comment: string | null,
) {
  await api.post(`/absence-requests/${requestId}/${decision}`, { comment });
}

export async function cancelAbsenceRequest(requestId: number) {
  await api.post(`/absence-requests/${requestId}/cancel`);
}
