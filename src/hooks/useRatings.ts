import { useQuery } from "@tanstack/react-query";
import { getClassRating } from "@/apis/ratings.api";

export function useClassRating(classId: number | null) {
  return useQuery({
    queryKey: ["ratings", "class", classId],
    queryFn: () => getClassRating(classId ?? 0),
    enabled: classId !== null,
  });
}
