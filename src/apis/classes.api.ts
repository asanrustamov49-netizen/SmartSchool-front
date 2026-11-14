import api from "@/lib/axios";

// Схема ClassOut
export type SchoolClass = {
  id: number;
  grade_number: number;
  letter: string;
  school_id: number;
  class_teacher_id: number | null;
  academic_year: string;
};

// Схема ClassCreate. PUT /classes/{id} принимает её же и перезаписывает все поля,
// поэтому при редактировании class_teacher_id нужно передавать текущее значение.
export type ClassCreate = {
  grade_number: number;
  letter: string;
  class_teacher_id: number | null;
  academic_year: string;
};

export function getClassName(schoolClass: SchoolClass) {
  return `${schoolClass.grade_number}-${schoolClass.letter}`;
}

export async function getClasses(): Promise<SchoolClass[]> {
  const response = await api.get<SchoolClass[]>("/classes/");
  return response.data;
}

export async function createClass(data: ClassCreate): Promise<SchoolClass> {
  const response = await api.post<SchoolClass>("/classes/", data);
  return response.data;
}

export async function updateClass(
  classId: number,
  data: ClassCreate,
): Promise<SchoolClass> {
  const response = await api.put<SchoolClass>(`/classes/${classId}`, data);
  return response.data;
}
