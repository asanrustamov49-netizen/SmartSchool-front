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
