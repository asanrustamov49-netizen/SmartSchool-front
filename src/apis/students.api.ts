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

export async function createStudent(data: StudentCreate): Promise<StudentCreated> {
  const response = await api.post<StudentCreated>("/students/", data);
  return response.data;
}

export async function updateStudent(studentId: number, data: StudentUpdate) {
  await api.put(`/students/${studentId}`, data);
}
