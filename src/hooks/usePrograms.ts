import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClassProgram,
  getPrograms,
  importProgram,
  updateTopicProgress,
  type ClassProgram,
  type TopicProgressUpdate,
} from "@/apis/programs.api";

const programsQueryKey = ["programs"];

function classProgramKey(classId: number, subjectId: number) {
  return [...programsQueryKey, "class", classId, subjectId];
}

export function usePrograms() {
  return useQuery({ queryKey: programsQueryKey, queryFn: getPrograms });
}

export function useClassProgram(classId: number, subjectId: number) {
  return useQuery({
    queryKey: classProgramKey(classId, subjectId),
    queryFn: () => getClassProgram(classId, subjectId),
  });
}

// Отметка «пройдено» видна сразу (не ждём ответа сервера); при ошибке возвращается как было.
export function useUpdateTopicProgress(classId: number, subjectId: number) {
  const queryClient = useQueryClient();
  const key = classProgramKey(classId, subjectId);

  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: number; data: TopicProgressUpdate }) =>
      updateTopicProgress(classId, subjectId, topicId, data),
    onMutate: async ({ topicId, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ClassProgram>(key);
      const today = new Date().toISOString().slice(0, 10);
      queryClient.setQueryData<ClassProgram>(key, (program) =>
        program
          ? {
              ...program,
              topics: program.topics.map((topic) =>
                topic.id === topicId
                  ? {
                      ...topic,
                      done_on: data.done ? (topic.done_on ?? today) : null,
                      note: data.done ? (data.note ?? topic.note) : null,
                    }
                  : topic,
              ),
            }
          : program,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    // Прогресс на карточках списка тоже меняется.
    onSettled: () => queryClient.invalidateQueries({ queryKey: programsQueryKey }),
  });
}

export function useImportProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importProgram,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programsQueryKey }),
  });
}
