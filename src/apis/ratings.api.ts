import api from "@/lib/axios";

// GET /ratings/school. Схема ответа в openapi.json пустая,
// поля взяты из backend: mysite/api/ratings.py (school_rating) и services/rating.py (rank).
export type RatingItem = {
  rank: number;
  student_id: number;
  full_name: string;
  avatar_url: string | null;
  class_id: number | null;
  class_name: string | null;
  xp: number;
};

export type SchoolRating = {
  scope: "school";
  items: RatingItem[];
};

export async function getSchoolRating(limit: number): Promise<SchoolRating> {
  const response = await api.get<SchoolRating>("/ratings/school", {
    params: { limit },
  });
  return response.data;
}

// Общий запрос рейтинга для страницы «Рейтинг» (backend: mysite/api/ratings.py).
// Без предмета места считаются по общему XP, с предметом — по XP этого предмета.
export type RatingScope =
  | { kind: "school" }
  | { kind: "class"; classId: number }
  | { kind: "parallel"; grade: number };

export type Rating = {
  items: RatingItem[];
};

export async function getRating(
  scope: RatingScope,
  subjectId: number | null,
  limit: number,
): Promise<Rating> {
  const subjectParam = subjectId ?? undefined;

  if (scope.kind === "class") {
    const response = await api.get<Rating>(`/ratings/class/${scope.classId}`, {
      params: { subject_id: subjectParam },
    });
    return response.data;
  }

  if (scope.kind === "parallel") {
    const response = await api.get<Rating>(`/ratings/parallel/${scope.grade}`, {
      params: { subject_id: subjectParam, limit },
    });
    return response.data;
  }

  const url = subjectId === null ? "/ratings/school" : `/ratings/subjects/${subjectId}`;
  const response = await api.get<Rating>(url, { params: { limit } });
  return response.data;
}
