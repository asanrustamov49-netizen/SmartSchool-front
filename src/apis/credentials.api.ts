import api from "@/lib/axios";

// Логины и временные пароли для раздачи (backend: mysite/api/admin.py).
// Класс видят директор, завуч и классный руководитель этого класса.
// temporary_password приходит, пока человек не сменил выданный пароль.
export type CredentialRow = {
  id: number;
  inn: string;
  full_name: string;
  role: string;
  is_temp_password: boolean;
  temporary_password: string | null;
};

export type ClassCredentials = {
  class_id: number;
  class_name: string;
  total: number;
  students: CredentialRow[];
};

export type StudentPasswordReset = {
  student_id: number;
  inn: string;
  full_name: string;
  temporary_password: string;
};

export async function getClassCredentials(classId: number): Promise<ClassCredentials> {
  const response = await api.get<ClassCredentials>(`/classes/${classId}/temp-passwords`);
  return response.data;
}

export async function downloadClassCredentials(classId: number): Promise<Blob> {
  const response = await api.get<Blob>(`/classes/${classId}/temp-passwords`, {
    params: { format: "xlsx" },
    responseType: "blob",
  });
  return response.data;
}

// Сброс пароля ученика внутри класса — доступен и классному руководителю.
export async function resetClassStudentPassword(
  classId: number,
  studentId: number,
): Promise<StudentPasswordReset> {
  const response = await api.post<StudentPasswordReset>(
    `/classes/${classId}/students/${studentId}/reset-password`,
  );
  return response.data;
}

// Лист логинов учителей (только для директора и завуча).
export async function downloadTeachersCredentials(): Promise<Blob> {
  const response = await api.get<Blob>("/admin/teachers/temp-passwords", {
    params: { format: "xlsx" },
    responseType: "blob",
  });
  return response.data;
}
