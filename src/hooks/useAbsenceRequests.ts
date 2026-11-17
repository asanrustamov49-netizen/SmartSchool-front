import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAbsenceRequest,
  createAbsenceRequest,
  getAbsenceRequests,
  getAbsenceRules,
  reviewAbsenceRequest,
  type AbsenceStatus,
} from "@/apis/absence.api";

const absenceQueryKey = ["absence-requests"];

// enabled = false — когда роли заявки недоступны (ученик получил бы 403).
export function useAbsenceRequests(status: AbsenceStatus | null, enabled = true) {
  return useQuery({
    queryKey: [...absenceQueryKey, "list", status],
    queryFn: () => getAbsenceRequests(status),
    enabled,
  });
}

export function useAbsenceRules(enabled: boolean) {
  return useQuery({
    queryKey: [...absenceQueryKey, "rules"],
    queryFn: getAbsenceRules,
    enabled,
  });
}

function useInvalidateAbsence() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: absenceQueryKey });
    // Одобренная заявка ставит в журнале отметку «С».
    queryClient.invalidateQueries({ queryKey: ["journal", "day"] });
  };
}

export function useCreateAbsenceRequest() {
  const invalidate = useInvalidateAbsence();
  return useMutation({ mutationFn: createAbsenceRequest, onSuccess: invalidate });
}

export function useReviewAbsenceRequest() {
  const invalidate = useInvalidateAbsence();

  return useMutation({
    mutationFn: ({
      requestId,
      decision,
      comment,
    }: {
      requestId: number;
      decision: "approve" | "reject";
      comment: string | null;
    }) => reviewAbsenceRequest(requestId, decision, comment),
    onSuccess: invalidate,
  });
}

export function useCancelAbsenceRequest() {
  const invalidate = useInvalidateAbsence();
  return useMutation({ mutationFn: cancelAbsenceRequest, onSuccess: invalidate });
}
