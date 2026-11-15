import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementsPage,
  updateAnnouncement,
  type AnnouncementInput,
} from "@/apis/announcements.api";

export const ANNOUNCEMENTS_PAGE_SIZE = 10;

// Ключ ["announcements"] общий с блоком объявлений на главной:
// после изменений обновляются оба списка.
const announcementsQueryKey = ["announcements"];

export function useAnnouncementsList() {
  return useInfiniteQuery({
    queryKey: [...announcementsQueryKey, "list"],
    queryFn: ({ pageParam }) => getAnnouncementsPage(ANNOUNCEMENTS_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === ANNOUNCEMENTS_PAGE_SIZE
        ? allPages.length * ANNOUNCEMENTS_PAGE_SIZE
        : undefined,
  });
}

export function useSaveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ announcementId, data }: { announcementId: number | null; data: AnnouncementInput }) =>
      announcementId === null ? createAnnouncement(data) : updateAnnouncement(announcementId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: announcementsQueryKey }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: announcementsQueryKey }),
  });
}
