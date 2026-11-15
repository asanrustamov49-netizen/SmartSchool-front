import api from "@/lib/axios";
import type { ExcelImportResult } from "@/apis/students.api";

// Схема TeacherCreate: inn — 14 цифр, full_name — 3–200 символов.
export type TeacherCreate = {
  inn: string;
  full_name: string;
  phone: string | null;
};

// Схема TeacherCreatedOut. Временный пароль приходит только один раз.
export type TeacherCreated = {
  id: number;
  inn: string;
  full_name: string;
  temporary_password: string;
  role: string;
  school_id: number;
};

// Ответ POST /teachers/import-excel (backend: teacher_import.py).
type TeacherImportResponse = Omit<ExcelImportResult, "added_users"> & {
  added_teachers: ExcelImportResult["added_users"];
};

export async function createTeacher(data: TeacherCreate): Promise<TeacherCreated> {
  const response = await api.post<TeacherCreated>("/users/create-teacher", data);
  return response.data;
}

export async function downloadTeachersTemplate(): Promise<Blob> {
  const response = await api.get<Blob>("/admin/excel/templates/teachers", {
    responseType: "blob",
  });
  return response.data;
}

export async function importTeachersExcel(file: Blob): Promise<ExcelImportResult> {
  const formData = new FormData();
  formData.append("file", file, "teachers.xlsx");

  const response = await api.post<TeacherImportResponse>("/teachers/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const { total_added, added_teachers, errors } = response.data;
  return { total_added, added_users: added_teachers, errors };
}
