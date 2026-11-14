import api from "@/lib/axios";

// Схема SubjectOut
export type Subject = {
  id: number;
  name: string;
  code: string | null;
  school_id: number;
};

// Схема SubjectCreate
export type SubjectCreate = {
  name: string;
  code: string | null;
};

export async function getSubjects(): Promise<Subject[]> {
  const response = await api.get<Subject[]>("/subjects/");
  return response.data;
}

export async function createSubject(data: SubjectCreate): Promise<Subject> {
  const response = await api.post<Subject>("/subjects/", data);
  return response.data;
}
