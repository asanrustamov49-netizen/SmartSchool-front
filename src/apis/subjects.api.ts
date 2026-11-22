import api from "@/lib/axios";

// Схема SubjectOut
export type Subject = {
  id: number;
  name: string;
  school_id: number;
};

// Схема SubjectCreate
export type SubjectCreate = {
  name: string;
};

export async function getSubjects(): Promise<Subject[]> {
  const response = await api.get<Subject[]>("/subjects/");
  return response.data;
}

export async function createSubject(data: SubjectCreate): Promise<Subject> {
  const response = await api.post<Subject>("/subjects/", data);
  return response.data;
}

// Схема SubjectUpdate: name 2–100 символов.
export async function updateSubject(subjectId: number, data: SubjectCreate): Promise<Subject> {
  const response = await api.put<Subject>(`/subjects/${subjectId}`, data);
  return response.data;
}

// Backend отказывает (400), если к предмету ещё привязаны учителя.
export async function deleteSubject(subjectId: number) {
  await api.delete(`/subjects/${subjectId}`);
}
