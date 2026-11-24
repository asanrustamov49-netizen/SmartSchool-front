import api from "@/lib/axios";
import type { StudentStanding } from "./auth.api";

// GET /students/. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/students.py (get_students).
export type Student = {
  id: number;
  email: string;
  full_name: string;
  class_id: number | null;
  is_active: boolean;
};

// Схема StudentCreate
export type StudentCreate = {
  email: string;
  full_name: string;
  class_id: number;
};

// Ответ POST /students/ (backend: create_student). Временный пароль приходит только один раз.
export type StudentCreated = {
  message: string;
  id: number;
  email: string;
  full_name: string;
  role: string;
  class_id: number;
  academic_year: string;
  temporary_password: string;
};

// Схема StudentUpdate
export type StudentUpdate = {
  full_name: string;
  // Новая почта (логин); при ошибке в адресе её исправляет директор или завуч.
  email: string;
};

export async function getStudents(): Promise<Student[]> {
  const response = await api.get<Student[]>("/students/");
  return response.data;
}

// GET /students/class/{class_id}. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/students.py (get_class_students).
export type ClassStudent = {
  id: number;
  email: string;
  full_name: string;
  class_id: number;
  academic_year: string;
};

export async function getClassStudents(classId: number): Promise<ClassStudent[]> {
  const response = await api.get<ClassStudent[]>(`/students/class/${classId}`);
  return response.data;
}

export async function createStudent(data: StudentCreate): Promise<StudentCreated> {
  const response = await api.post<StudentCreated>("/students/", data);
  return response.data;
}

export async function updateStudent(studentId: number, data: StudentUpdate) {
  await api.put(`/students/${studentId}`, data);
}

// Результат Excel-импорта учеников и учителей в одном виде.
// row в errors — номер строки в загруженном файле. Временные пароли приходят один раз.
export type ExcelImportResult = {
  total_added: number;
  added_users: { email: string; full_name: string; temporary_password: string }[];
  errors: { row: number; error: string }[];
};

// Ответ POST /students/import-excel/{class_id} (backend: student_import.py).
type StudentImportResponse = Omit<ExcelImportResult, "added_users"> & {
  added_students: ExcelImportResult["added_users"];
};

// Шаблон с правильными колонками отдаёт backend: Почта | Толук аты-жөнү.
export async function downloadStudentsTemplate(): Promise<Blob> {
  const response = await api.get<Blob>("/admin/excel/templates/students", {
    responseType: "blob",
  });
  return response.data;
}

export async function importStudentsExcel(classId: number, file: Blob): Promise<ExcelImportResult> {
  const formData = new FormData();
  formData.append("file", file, "students.xlsx");

  const response = await api.post<StudentImportResponse>(
    `/students/import-excel/${classId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const { total_added, added_students, errors } = response.data;
  return { total_added, added_users: added_students, errors };
}

// DELETE /students/{id} не удаляет ученика, а делает его неактивным.
export async function deactivateStudent(studentId: number) {
  await api.delete(`/students/${studentId}`);
}


// GET /students/{id}/history — классы ученика по учебным годам (backend: get_student_history).
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | string;

export type StudentHistory = {
  student_id: number;
  full_name: string;
  history: { academic_year: string; class_id: number; class_name: string; status: EnrollmentStatus }[];
};

export async function getStudentHistory(studentId: number): Promise<StudentHistory> {
  const response = await api.get<StudentHistory>(`/students/${studentId}/history`);
  return response.data;
}

// GET /profiles/students/{id} — XP, места в рейтинге и награды (тот же формат, что student в /me).
export async function getStudentProfile(studentId: number): Promise<StudentStanding> {
  const response = await api.get<StudentStanding>(`/profiles/students/${studentId}`);
  return response.data;
}
