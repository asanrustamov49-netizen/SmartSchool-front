"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { getClassName, type SchoolClass } from "@/apis/classes.api";
import { Select } from "@/components/ui/Select";
import { useClasses, useCreateClass, useUpdateClass } from "@/hooks/useClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { textRule, validateClassLetter } from "@/lib/textChecks";
import styles from "./admin.module.scss";

type ClassFormValues = {
  grade_number: string;
  letter: string;
  academic_year: string;
  class_teacher_id: string;
};

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, index) => String(index + 1));

type ClassFormProps = {
  schoolClass: SchoolClass | null;
  onClose: () => void;
};

export function ClassForm({ schoolClass, onClose }: ClassFormProps) {
  const t = useTranslations("admin.classes");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const mutation = schoolClass ? updateClass : createClass;
  const teachersQuery = useTeachers();
  const classesQuery = useClasses();

  // Правила из схемы ClassCreate: grade_number 1–11, letter 1–5 символов, academic_year обязателен.
  const classSchema = z.object({
    grade_number: z.string().min(1, tForm("required")),
    letter: z
      .string()
      .trim()
      .min(1, tForm("required"))
      .superRefine(textRule(validateClassLetter, (problem) => tChecks(problem))),
    academic_year: z.string().trim().min(1, tForm("required")),
    class_teacher_id: z.string(),
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      grade_number: schoolClass ? String(schoolClass.grade_number) : "",
      letter: schoolClass?.letter ?? "",
      academic_year: schoolClass?.academic_year ?? "",
      class_teacher_id: schoolClass?.class_teacher_id ? String(schoolClass.class_teacher_id) : "",
    },
  });

  const handleError = (error: Error) => {
    const fieldErrors = getApiFieldErrors(error);

    if (fieldErrors.grade_number) {
      setError("grade_number", { message: fieldErrors.grade_number });
    }

    if (fieldErrors.letter) {
      setError("letter", { message: fieldErrors.letter });
    }

    if (fieldErrors.academic_year) {
      setError("academic_year", { message: fieldErrors.academic_year });
    }
  };

  const onSubmit = (values: ClassFormValues) => {
    const data = {
      grade_number: Number(values.grade_number),
      letter: values.letter.trim(),
      academic_year: values.academic_year.trim(),
      class_teacher_id: values.class_teacher_id ? Number(values.class_teacher_id) : null,
    };

    if (schoolClass) {
      updateClass.mutate(
        { classId: schoolClass.id, data },
        { onSuccess: onClose, onError: handleError },
      );
      return;
    }

    createClass.mutate(data, { onSuccess: onClose, onError: handleError });
  };

  // Рядом с именем учителя — классы, которые он уже ведёт, чтобы случайно не назначить его дважды.
  const ledClassNames = new Map<number, string[]>();
  for (const otherClass of classesQuery.data ?? []) {
    if (otherClass.class_teacher_id !== null && otherClass.id !== schoolClass?.id) {
      const names = ledClassNames.get(otherClass.class_teacher_id) ?? [];
      names.push(getClassName(otherClass));
      ledClassNames.set(otherClass.class_teacher_id, names);
    }
  }
  const teacherOptions = (teachersQuery.data ?? [])
    .filter((teacher) => teacher.is_active || teacher.id === schoolClass?.class_teacher_id)
    .map((teacher) => {
      const ledNames = ledClassNames.get(teacher.id);
      return {
        value: String(teacher.id),
        label: ledNames ? `${teacher.full_name} · ${ledNames.join(", ")}` : teacher.full_name,
      };
    });

  const hasFieldErrors = Object.keys(getApiFieldErrors(mutation.error)).length > 0;
  const formError =
    mutation.isError && !hasFieldErrors ? handleApiError(mutation.error, tApiErrors) : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>
        {schoolClass ? t("editTitle") : t("createTitle")}
      </h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="class-grade">{t("gradeNumber")}</label>
          <Controller
            control={control}
            name="grade_number"
            render={({ field }) => (
              <Select
                id="class-grade"
                value={field.value}
                onValueChange={field.onChange}
                invalid={Boolean(errors.grade_number)}
                placeholder={tForm("choose")}
                options={GRADE_NUMBERS.map((gradeNumber) => ({
                  value: String(gradeNumber),
                  label: String(gradeNumber),
                }))}
              />
            )}
          />
          {errors.grade_number && (
            <p className={styles.fieldError}>{errors.grade_number.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="class-letter">{t("letter")}</label>
          <input
            id="class-letter"
            className={styles.input}
            maxLength={5}
            placeholder={t("letterPlaceholder")}
            aria-invalid={Boolean(errors.letter)}
            {...register("letter")}
          />
          {errors.letter && <p className={styles.fieldError}>{errors.letter.message}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="class-year">{t("academicYear")}</label>
          <input
            id="class-year"
            className={styles.input}
            placeholder={t("academicYearPlaceholder")}
            aria-invalid={Boolean(errors.academic_year)}
            {...register("academic_year")}
          />
          {errors.academic_year && (
            <p className={styles.fieldError}>{errors.academic_year.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="class-teacher">{t("classTeacher")}</label>
          <Controller
            control={control}
            name="class_teacher_id"
            render={({ field }) => (
              <Select
                id="class-teacher"
                value={field.value}
                onValueChange={field.onChange}
                disabled={teachersQuery.isPending}
                options={[{ value: "", label: t("noClassTeacher") }, ...teacherOptions]}
              />
            )}
          />
          {teachersQuery.isError && (
            <p className={styles.fieldError}>{handleApiError(teachersQuery.error, tApiErrors)}</p>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={mutation.isPending}>
            {mutation.isPending && <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
