import api from "@/lib/axios";

// GET /students/. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/students.py (get_students).
export type Student = {
  id: number;
  inn: string;
  full_name: string;
  phone: string | null;
  class_id: number | null;
  is_active: boolean;
};

// Схема StudentCreate
export type StudentCreate = {
  inn: string;
  full_name: string;
  phone: string | null;
  class_id: number;
};

// Ответ POST /students/ (backend: create_student). Временный пароль приходит только один раз.
export type StudentCreated = {
  message: string;
  id: number;
  inn: string;
  full_name: string;
  role: string;
  class_id: number;
  academic_year: string;
  temporary_password: string;
};

// Схема StudentUpdate
export type StudentUpdate = {
  full_name: string;
  phone: string | null;
};

export async function getStudents(): Promise<Student[]> {
  const response = await api.get<Student[]>("/students/");
  return response.data;
}

// GET /students/class/{class_id}. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/students.py (get_class_students).
export type ClassStudent = {
  id: number;
  inn: string;
  full_name: string;
  phone: string | null;
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
  added_users: { inn: string; full_name: string; temporary_password: string }[];
  errors: { row: number; error: string }[];
};

// Ответ POST /students/import-excel/{class_id} (backend: student_import.py).
type StudentImportResponse = Omit<ExcelImportResult, "added_users"> & {
  added_students: ExcelImportResult["added_users"];
};

// Ответ POST /admin/users/{id}/reset-password (backend: admin.py).
export type PasswordResetResult = {
  message: string;
  user_id: number;
  inn: string;
  full_name: string;
  temporary_password: string;
};

// Шаблон с правильными колонками отдаёт backend: ИНН | Толук аты-жөнү | Телефон.
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

export async function resetStudentPassword(studentId: number): Promise<PasswordResetResult> {
  const response = await api.post<PasswordResetResult>(`/admin/users/${studentId}/reset-password`);
  return response.data;
}
