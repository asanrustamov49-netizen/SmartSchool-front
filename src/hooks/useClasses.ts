import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClass,
  getClasses,
  updateClass,
  type ClassCreate,
} from "@/apis/classes.api";

const classesQueryKey = ["classes"];

// Справочник меняется редко: 10 минут без перезапроса. После изменений кэш сбрасывают мутации.
export const classesQuery = queryOptions({
  queryKey: classesQueryKey,
  queryFn: getClasses,
  staleTime: 10 * 60 * 1000,
});

// enabled = false — когда список классов роли не нужен (например, ученику на странице рейтинга).
export function useClasses(enabled = true) {
  return useQuery({ ...classesQuery, enabled });
}

function useInvalidateClasses() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: classesQueryKey });
    // Число классов показывается на главной.
    queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  };
}

export function useCreateClass() {
  const invalidateClasses = useInvalidateClasses();

  return useMutation({
    mutationFn: createClass,
    onSuccess: invalidateClasses,
  });
}

export function useUpdateClass() {
  const invalidateClasses = useInvalidateClasses();

  return useMutation({
    mutationFn: ({ classId, data }: { classId: number; data: ClassCreate }) =>
      updateClass(classId, data),
    onSuccess: invalidateClasses,
  });
}
