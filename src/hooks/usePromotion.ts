import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executePromotion, getPromotionPreview } from "@/apis/promotion.api";

export function usePromotionPreview(sourceYear: string, targetYear: string | null) {
  return useQuery({
    queryKey: ["promotion", sourceYear, targetYear],
    queryFn: () => getPromotionPreview(sourceYear, targetYear ?? ""),
    enabled: sourceYear !== "" && targetYear !== null,
    retry: false,
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
