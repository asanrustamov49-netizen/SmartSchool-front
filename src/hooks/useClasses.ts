import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClass,
  getClasses,
  updateClass,
  type ClassCreate,
} from "@/apis/classes.api";

const classesQueryKey = ["classes"];

export function useClasses() {
  return useQuery({
    queryKey: classesQueryKey,
    queryFn: getClasses,
  });
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
