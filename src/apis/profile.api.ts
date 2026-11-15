import api from "@/lib/axios";
import type { CurrentUser } from "@/apis/auth.api";

// Схема ProfileUpdate. full_name может менять только директор, завуч или родитель,
// остальным backend отвечает 403 — поэтому для них поле не отправляется.
export type ProfileUpdate = {
  full_name?: string;
  phone: string | null;
};

// Схема PasswordChange: new_password — от 8 до 128 символов.
export type PasswordChange = {
  current_password: string;
  new_password: string;
};

export async function updateProfile(data: ProfileUpdate): Promise<CurrentUser> {
  const response = await api.put<CurrentUser>("/me", data);
  return response.data;
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{ avatar_url: string }>("/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function changePassword(data: PasswordChange) {
  await api.post("/me/change-password", data);
}
