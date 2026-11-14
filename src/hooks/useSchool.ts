import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMySchool,
  updateMySchool,
  uploadSchoolImage,
  type School,
  type SchoolImageType,
} from "@/apis/schools.api";
import { currentUserQueryKey } from "@/hooks/useAuth";

const mySchoolQueryKey = ["school", "me"];

export function useMySchool() {
  return useQuery({
    queryKey: mySchoolQueryKey,
    queryFn: getMySchool,
  });
}

function useSaveSchool() {
  const queryClient = useQueryClient();

  return (school: School) => {
    queryClient.setQueryData(mySchoolQueryKey, school);
    // Название, адрес и логотип школы приходят и в /me (карточка в боковом меню).
    queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  };
}

export function useUpdateMySchool() {
  const saveSchool = useSaveSchool();

  return useMutation({
    mutationFn: updateMySchool,
    onSuccess: saveSchool,
  });
}

export function useUploadSchoolImage() {
  const saveSchool = useSaveSchool();

  return useMutation({
    mutationFn: ({ imageType, file }: { imageType: SchoolImageType; file: File }) =>
      uploadSchoolImage(imageType, file),
    onSuccess: saveSchool,
  });
}
