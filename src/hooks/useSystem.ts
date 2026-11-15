import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addSchoolAdmin,
  createSystemSchool,
  getPlatformStats,
  getSystemSchool,
  getSystemSchools,
  resetSchoolAdminPassword,
  setSchoolActive,
  setSchoolAdminActive,
  updateSystemSchool,
  type SchoolAdminFields,
  type SchoolAdminRole,
  type SystemSchoolFields,
} from "@/apis/system.api";

const systemQueryKey = ["system"];
const statsQueryKey = ["system", "stats"];
const schoolsQueryKey = ["system", "schools"];

function schoolQueryKey(schoolId: number) {
  return ["system", "school", schoolId];
}

export function usePlatformStats() {
  return useQuery({ queryKey: statsQueryKey, queryFn: getPlatformStats });
}

export function useSystemSchools() {
  return useQuery({ queryKey: schoolsQueryKey, queryFn: getSystemSchools });
}

export function useSystemSchool(schoolId: number) {
  return useQuery({
    queryKey: schoolQueryKey(schoolId),
    queryFn: () => getSystemSchool(schoolId),
    enabled: Number.isInteger(schoolId) && schoolId > 0,
  });
}

// Любое изменение на платформе влияет на статистику, список школ и карточку школы.
function useInvalidateSystem() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: systemQueryKey });
}

export function useCreateSystemSchool() {
  const invalidateSystem = useInvalidateSystem();
  return useMutation({ mutationFn: createSystemSchool, onSuccess: invalidateSystem });
}

export function useUpdateSystemSchool() {
  const invalidateSystem = useInvalidateSystem();
  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: number; data: SystemSchoolFields }) =>
      updateSystemSchool(schoolId, data),
    onSuccess: invalidateSystem,
  });
}

export function useSetSchoolActive() {
  const invalidateSystem = useInvalidateSystem();
  return useMutation({
    mutationFn: ({ schoolId, active }: { schoolId: number; active: boolean }) =>
      setSchoolActive(schoolId, active),
    onSuccess: invalidateSystem,
  });
}

export function useAddSchoolAdmin() {
  const invalidateSystem = useInvalidateSystem();
  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: number;
      data: SchoolAdminFields & { role: SchoolAdminRole };
    }) => addSchoolAdmin(schoolId, data),
    onSuccess: invalidateSystem,
  });
}

export function useResetSchoolAdminPassword() {
  const invalidateSystem = useInvalidateSystem();
  return useMutation({ mutationFn: resetSchoolAdminPassword, onSuccess: invalidateSystem });
}

export function useSetSchoolAdminActive() {
  const invalidateSystem = useInvalidateSystem();
  return useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) =>
      setSchoolAdminActive(userId, active),
    onSuccess: invalidateSystem,
  });
}
