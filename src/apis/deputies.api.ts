import api from "@/lib/axios";
import type { SchoolAdmin, SchoolAdminFields } from "./system.api";

// Завучи школы (backend: mysite/api/admin.py, /admin/deputies).
// Список видят директор и завуч, временные пароли — только директор.
// Добавляет и отключает завучей только директор; пароль сбрасывается
// общим POST /admin/users/{id}/reset-password (users.api.ts).

export async function getDeputies(): Promise<SchoolAdmin[]> {
  const response = await api.get<SchoolAdmin[]>("/admin/deputies");
  return response.data;
}

export async function createDeputy(data: SchoolAdminFields): Promise<SchoolAdmin> {
  const response = await api.post<SchoolAdmin>("/admin/deputies", data);
  return response.data;
}

export async function deactivateDeputy(userId: number) {
  await api.delete(`/admin/deputies/${userId}`);
}
