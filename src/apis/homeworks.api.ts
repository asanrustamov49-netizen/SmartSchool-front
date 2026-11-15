import api from "@/lib/axios";

// Поля взяты из backend: mysite/api/homeworks.py (serialize, serialize_submission).

export type HomeworkSubmission = {
  id: number;
  homework_id: number;
  student_id: number;
  text: string | null;
  file_urls: string[];
  submitted_at: string;
};

export type Homework = {
  id: number;
  assignment_id: number;
  class_id: number;
  class_name: string | null;
  subject_id: number;
  subject_name: string | null;
  teacher_id: number;
  teacher_name: string | null;
  title: string;
  description: string | null;
  image_urls: string[];
  file_urls: string[];
  due_date: string | null;
  created_at: string;
  // Есть только в ответе для ученика и родителя.
  is_submitted?: boolean;
  submission?: HomeworkSubmission;
};

export type SubmissionWithStudent = HomeworkSubmission & { student_name: string };

// Backend принимает за раз не больше 10 файлов (MAX_FILES_PER_UPLOAD).
export const MAX_HOMEWORK_FILES = 10;

export type HomeworkCreate = {
  assignment_id: number;
  title: string;
  description: string;
  due_date: string;
  files: File[];
};

const multipartHeaders = { "Content-Type": "multipart/form-data" };

export async function getHomeworks(studentId: number | null): Promise<Homework[]> {
  const response = await api.get<Homework[]>("/homeworks", {
    params: { student_id: studentId ?? undefined, limit: 200 },
  });
  return response.data;
}

export async function createHomework(data: HomeworkCreate) {
  const formData = new FormData();
  formData.append("assignment_id", String(data.assignment_id));
  formData.append("title", data.title.trim());
  if (data.description.trim() !== "") {
    formData.append("description", data.description.trim());
  }
  if (data.due_date !== "") {
    formData.append("due_date", data.due_date);
  }
  for (const file of data.files) {
    formData.append("files", file);
  }

  await api.post("/homeworks", formData, { headers: multipartHeaders });
}

export async function deleteHomework(homeworkId: number) {
  await api.delete(`/homeworks/${homeworkId}`);
}

// Повторная сдача дополняет ответ: новые файлы добавляются к уже отправленным.
export async function submitHomework(homeworkId: number, data: { text: string; files: File[] }) {
  const formData = new FormData();
  if (data.text.trim() !== "") {
    formData.append("text", data.text.trim());
  }
  for (const file of data.files) {
    formData.append("files", file);
  }

  await api.post(`/homeworks/${homeworkId}/submit`, formData, { headers: multipartHeaders });
}

export async function getHomeworkSubmissions(homeworkId: number): Promise<SubmissionWithStudent[]> {
  const response = await api.get<SubmissionWithStudent[]>(`/homeworks/${homeworkId}/submissions`);
  return response.data;
}
