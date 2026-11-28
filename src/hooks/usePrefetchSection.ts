import { useQueryClient } from "@tanstack/react-query";
import { classesQuery } from "./useClasses";
import { journalAssignmentsQuery } from "./useJournal";
import { studentsQuery } from "./useStudents";
import { subjectsQuery } from "./useSubjects";
import { teachersQuery } from "./useTeachers";

// Данные разделов начинают загружаться, когда курсор наводится на пункт меню (или пункт
// получает фокус, или палец касается вкладки) — раздел открывается уже с готовым списком.
// Ключи те же, что в хуках, поэтому повторного запроса при открытии нет, а свежие данные
// (staleTime) не перезапрашиваются. Только разделы, которые видит роль с этим пунктом меню.
export function usePrefetchSection() {
  const queryClient = useQueryClient();

  return (href: string) => {
    switch (href) {
      case "/admin/students":
        void queryClient.prefetchQuery(studentsQuery);
        void queryClient.prefetchQuery(classesQuery);
        break;
      case "/admin/teachers":
        void queryClient.prefetchQuery(teachersQuery);
        break;
      case "/admin/classes":
        void queryClient.prefetchQuery(classesQuery);
        break;
      case "/admin/subjects":
        void queryClient.prefetchQuery(subjectsQuery);
        break;
      case "/journal":
        void queryClient.prefetchQuery(journalAssignmentsQuery);
        break;
    }
  };
}
