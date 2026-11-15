import api from "@/lib/axios";

// GET /users/{user_id}. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/users.py (get_user).
export type SchoolUser = {
  id: number;
  full_name: string;
  role: string;
  school_id: number;
};

export async function getUser(userId: number): Promise<SchoolUser> {
  const response = await api.get<SchoolUser>(`/users/${userId}`);
  return response.data;
}

// Ответ POST /admin/users/{id}/reset-password (backend: admin.py).
// Директор и завуч сбрасывают пароль ученику, учителю или родителю; новый пароль показывается один раз.
export type PasswordResetResult = {
  message: string;
  user_id: number;
  inn: string;
  full_name: string;
  temporary_password: string;
};

export async function resetUserPassword(userId: number): Promise<PasswordResetResult> {
  const response = await api.post<PasswordResetResult>(`/admin/users/${userId}/reset-password`);
  return response.data;
}
