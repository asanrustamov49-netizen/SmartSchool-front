"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Teacher, TeacherCreated } from "@/apis/teachers.api";
import { useCreateTeacher, useUpdateTeacher } from "@/hooks/useTeachers";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { textRule, validatePersonName } from "@/lib/textChecks";
import styles from "./admin.module.scss";

type TeacherFormValues = {
  email: string;
  fullName: string;
};

type TeacherFormProps = {
  // null — новый учитель, иначе редактирование (почту менять нельзя).
  teacher: Teacher | null;
  onCreated: (teacher: TeacherCreated) => void;
  onClose: () => void;
};

export function TeacherForm({ teacher, onCreated, onClose }: TeacherFormProps) {
  const t = useTranslations("admin.teachers");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const isEditing = teacher !== null;
  const activeMutation = isEditing ? updateTeacher : createTeacher;

  // Правила из схем TeacherCreate и TeacherUpdate: email — почта, full_name — 3–200 символов.
  const teacherSchema = z.object({
    email: isEditing ? z.string() : z.string().trim().pipe(z.email(tForm("emailFormat"))),
    fullName: z
      .string()
      .trim()
      .min(3, tForm("minLength", { count: 3 }))
      .max(200, tForm("maxLength", { count: 200 }))
      .superRefine(textRule(validatePersonName, (problem) => tChecks(problem))),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      email: teacher?.email ?? "",
      fullName: teacher?.full_name ?? "",
    },
  });

  const onSubmit = (values: TeacherFormValues) => {
    if (teacher) {
      updateTeacher.mutate(
        { teacherId: teacher.id, data: { full_name: values.fullName.trim() } },
        { onSuccess: onClose },
      );
      return;
    }

    createTeacher.mutate(
      {
        email: values.email.trim(),
        full_name: values.fullName.trim(),
      },
      {
        onSuccess: onCreated,
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.email) {
            setError("email", { message: fieldErrors.email });
          }
          if (fieldErrors.full_name) {
            setError("fullName", { message: fieldErrors.full_name });
          }
        },
      },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(activeMutation.error)).length > 0;
  const formError =
    activeMutation.isError && !hasFieldErrors
      ? handleApiError(activeMutation.error, tApiErrors)
      : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{isEditing ? t("editTitle") : t("createTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="teacher-name">{t("fullName")}</label>
          <input
            id="teacher-name"
            className={styles.input}
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {errors.fullName && <p className={styles.fieldError}>{errors.fullName.message}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="teacher-email">{t("email")}</label>
          <input
            id="teacher-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder={tForm("emailPlaceholder")}
            readOnly={isEditing}
            className={styles.input}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {isEditing && <span className={styles.fieldHint}>{t("emailReadonly")}</span>}
          {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={activeMutation.isPending}>
            {activeMutation.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
