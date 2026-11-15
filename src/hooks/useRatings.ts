import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRating, recomputeRatings, type RatingScope } from "@/apis/ratings.api";

export function useRating(scope: RatingScope, subjectId: number | null, limit: number) {
  return useQuery({
    queryKey: ["ratings", "page", scope, subjectId, limit],
    queryFn: () => getRating(scope, subjectId, limit),
  });
}

// После пересчёта меняются все рейтинги и XP на главной.
export function useRecomputeRatings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recomputeRatings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ratings"] }),
  });
}
