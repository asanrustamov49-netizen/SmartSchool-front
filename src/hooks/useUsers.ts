import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/apis/users.api";

export function useSchoolUser(userId: number | null) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => getUser(userId ?? 0),
    enabled: userId !== null,
    staleTime: 5 * 60 * 1000,
  });
}
