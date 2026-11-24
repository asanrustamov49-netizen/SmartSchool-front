import api from "@/lib/axios";
import type { ExcelImportResult } from "@/apis/students.api";

// Схема TeacherCreate: email — логин, full_name — 3–200 символов.
export type TeacherCreate = {
  email: string;
  full_name: string;
};

// Схема TeacherCreatedOut. Временный пароль приходит только один раз.
export type TeacherCreated = {
  id: number;
  email: string;
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

// GET /teachers (backend: mysite/api/teachers.py, serialize_teachers).
export type Teacher = {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  // true — учитель ещё ни разу не входил и не сменил временный пароль.
  is_temp_password: boolean;
  created_at: string;
  is_class_teacher: boolean;
  classes_led: { id: number; name: string | null; academic_year: string }[];
  assignments: {
    id: number;
    class_id: number;
    class_name: string | null;
    subject_id: number;
    subject_name: string | null;
    academic_year: string;
  }[];
};

// Схема TeacherUpdate: full_name 3–200 символов.
export type TeacherUpdate = {
  full_name: string;
  email: string;
};

export async function getTeachers(): Promise<Teacher[]> {
  const response = await api.get<Teacher[]>("/teachers", { params: { include_inactive: true } });
  return response.data;
}

export async function updateTeacher(teacherId: number, data: TeacherUpdate): Promise<Teacher> {
  const response = await api.put<Teacher>(`/teachers/${teacherId}`, data);
  return response.data;
}

// Деактивация не удаляет учителя: он не может войти, а его классное руководство снимается.
export async function deactivateTeacher(teacherId: number) {
  await api.delete(`/teachers/${teacherId}`);
}

export async function activateTeacher(teacherId: number) {
  await api.post(`/teachers/${teacherId}/activate`);
}

// Назначение: учитель ведёт предмет в классе (backend: mysite/api/teacher_assignments.py).
// Схема TeacherAssignmentCreate; учебный год берётся из класса.
export type AssignmentCreate = {
  teacher_id: number;
  class_id: number;
  subject_id: number;
  school_id: number;
  academic_year: string;
};

export async function createAssignment(data: AssignmentCreate) {
  await api.post("/teacher-assignments/", data);
}

// Внимание: в базе оценки журнала удаляются вместе с назначением (ON DELETE CASCADE).
export async function deleteAssignment(assignmentId: number) {
  await api.delete(`/teacher-assignments/${assignmentId}`);
}
