import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addOlympiadCandidate,
  approveOlympiadCandidate,
  autoSelectOlympiad,
  getOlympiadAnalytics,
  getOlympiadCandidates,
  removeOlympiadCandidate,
} from "@/apis/olympiad.api";

const olympiadQueryKey = ["olympiad"];

export function useOlympiadAnalytics(gradeNumber: number | null) {
  return useQuery({
    queryKey: [...olympiadQueryKey, "analytics", gradeNumber],
    queryFn: () => getOlympiadAnalytics(gradeNumber),
  });
}

export function useOlympiadCandidates() {
  return useQuery({
    queryKey: [...olympiadQueryKey, "candidates"],
    queryFn: getOlympiadCandidates,
  });
}

function useOlympiadMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: olympiadQueryKey });
      // Число отобранных на олимпиаду показывается на главной.
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useAddOlympiadCandidate() {
  return useOlympiadMutation(addOlympiadCandidate);
}

export function useApproveOlympiadCandidate() {
  return useOlympiadMutation(approveOlympiadCandidate);
}

export function useAutoSelectOlympiad() {
  return useOlympiadMutation(autoSelectOlympiad);
}

export function useRemoveOlympiadCandidate() {
  return useOlympiadMutation(removeOlympiadCandidate);
}
