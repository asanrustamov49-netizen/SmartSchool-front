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
