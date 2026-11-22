import api from "@/lib/axios";

// Схема SchoolOut
export type School = {
  id: number;
  name: string;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  director_name: string | null;
  is_active: boolean;
  created_at: string;
};

// Схема SchoolUpdate (без logo_url и banner_url: они меняются загрузкой файла)
export type SchoolUpdate = {
  name: string;
  email: string | null;
  director_name: string | null;
};

export type SchoolImageType = "logo" | "banner";

export async function getMySchool(): Promise<School> {
  const response = await api.get<School>("/schools/me");
  return response.data;
}

export async function updateMySchool(data: SchoolUpdate): Promise<School> {
  const response = await api.put<School>("/schools/me", data);
  return response.data;
}

// POST /schools/me/logo и /schools/me/banner — multipart/form-data с полем file.
export async function uploadSchoolImage(
  imageType: SchoolImageType,
  file: File,
): Promise<School> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<School>(`/schools/me/${imageType}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
