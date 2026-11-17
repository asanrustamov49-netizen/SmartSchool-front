import api from "@/lib/axios";
import type { SchoolAdmin, SchoolAdminFields } from "./system.api";

// Завучи школы (backend: mysite/api/admin.py, /admin/deputies).
// Список видят директор и завуч, временные пароли — только директор.
// Добавляет, изменяет, отключает и возвращает завучей только директор и только своей школы;
// пароль сбрасывается общим POST /admin/users/{id}/reset-password (users.api.ts).

export async function getDeputies(): Promise<SchoolAdmin[]> {
  const response = await api.get<SchoolAdmin[]>("/admin/deputies");
  return response.data;
}

export async function createDeputy(data: SchoolAdminFields): Promise<SchoolAdmin> {
  const response = await api.post<SchoolAdmin>("/admin/deputies", data);
  return response.data;
}

// Схема SchoolAdminUpdate: ИНН (логин) не меняется.
export type DeputyUpdate = {
  full_name: string;
  phone: string | null;
};

export async function updateDeputy(userId: number, data: DeputyUpdate): Promise<SchoolAdmin> {
  const response = await api.put<SchoolAdmin>(`/admin/deputies/${userId}`, data);
  return response.data;
}

// Вернуть отключённого завуча; backend не даёт превысить 5 активных.
export async function activateDeputy(userId: number) {
  await api.post(`/admin/deputies/${userId}/activate`);
}

export async function deactivateDeputy(userId: number) {
  await api.delete(`/admin/deputies/${userId}`);
}
