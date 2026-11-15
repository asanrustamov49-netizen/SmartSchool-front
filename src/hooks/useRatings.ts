import { useQuery } from "@tanstack/react-query";
import { getRating, type RatingScope } from "@/apis/ratings.api";

export function useRating(scope: RatingScope, subjectId: number | null, limit: number) {
  return useQuery({
    queryKey: ["ratings", "page", scope, subjectId, limit],
    queryFn: () => getRating(scope, subjectId, limit),
  });
}
