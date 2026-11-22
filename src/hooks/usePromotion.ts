import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executePromotion, getPromotionPreview, getPromotionReview, moveStudent } from "@/apis/promotion.api";

export function usePromotionPreview(sourceYear: string, targetYear: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["promotion", "preview", sourceYear, targetYear],
    queryFn: () => getPromotionPreview(sourceYear, targetYear ?? ""),
    enabled: enabled && sourceYear !== "" && targetYear !== null,
    retry: false,
  });
}

export function usePromotionReview(targetYear: string | null) {
  return useQuery({
    queryKey: ["promotion", "review", targetYear],
    queryFn: () => getPromotionReview(targetYear ?? ""),
    enabled: targetYear !== null,
  });
}

// Перевод меняет классы, учеников и статистику школы — обновляется всё, что от них зависит.
export function useExecutePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: executePromotion,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

// Перевод одного ученика: меняется его класс и, возможно, появляется новый класс.
export function useMoveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotion", "review"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
