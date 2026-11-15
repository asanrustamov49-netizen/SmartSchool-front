"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Teacher, TeacherCreated } from "@/apis/teachers.api";
import { useCreateTeacher, useUpdateTeacher } from "@/hooks/useTeachers";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import styles from "./admin.module.scss";

type TeacherFormValues = {
  inn: string;
  fullName: string;
  phone: string;
};

type TeacherFormProps = {
  // null — новый учитель, иначе редактирование (ИНН менять нельзя).
  teacher: Teacher | null;
  onCreated: (teacher: TeacherCreated) => void;
  onClose: () => void;
};

export function TeacherForm({ teacher, onCreated, onClose }: TeacherFormProps) {
  const t = useTranslations("admin.teachers");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const isEditing = teacher !== null;
  const activeMutation = isEditing ? updateTeacher : createTeacher;

  // Правила из схем TeacherCreate и TeacherUpdate: inn — 14 цифр, full_name — 3–200 символов.
  const teacherSchema = z.object({
    inn: isEditing ? z.string() : z.string().trim().regex(/^\d{14}$/, tForm("innFormat")),
    fullName: z
      .string()
      .trim()
      .min(3, tForm("minLength", { count: 3 }))
      .max(200, tForm("maxLength", { count: 200 })),
    phone: z.string(),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      inn: teacher?.inn ?? "",
      fullName: teacher?.full_name ?? "",
      phone: teacher?.phone ?? "",
    },
  });

  const onSubmit = (values: TeacherFormValues) => {
    if (teacher) {
      updateTeacher.mutate(
        {
          teacherId: teacher.id,
          data: { full_name: values.fullName.trim(), phone: emptyToNull(values.phone) },
        },
        { onSuccess: onClose },
      );
      return;
    }

    createTeacher.mutate(
      {
        inn: values.inn.trim(),
        full_name: values.fullName.trim(),
        phone: emptyToNull(values.phone),
      },
      {
        onSuccess: onCreated,
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.inn) {
            setError("inn", { message: fieldErrors.inn });
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
          <label htmlFor="teacher-inn">{t("inn")}</label>
          <input
            id="teacher-inn"
            inputMode="numeric"
            maxLength={14}
            readOnly={isEditing}
            className={styles.input}
            aria-invalid={Boolean(errors.inn)}
            {...register("inn")}
          />
          {isEditing && <span className={styles.fieldHint}>{t("innReadonly")}</span>}
          {errors.inn && <p className={styles.fieldError}>{errors.inn.message}</p>}
        </div>

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
          <label htmlFor="teacher-phone">{t("phone")}</label>
          <input id="teacher-phone" type="tel" className={styles.input} {...register("phone")} />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
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
