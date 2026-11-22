"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SystemSchool, SystemSchoolCreated } from "@/apis/system.api";
import { useCreateSystemSchool, useUpdateSystemSchool } from "@/hooks/useSystem";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { cn, emptyToNull } from "@/lib/utils";
import { textRule, validateFreeText, validatePersonName } from "@/lib/textChecks";
import styles from "../admin/admin.module.scss";

type SchoolFormValues = {
  name: string;
  email: string;
  directorEmail: string;
  directorName: string;
};

type SchoolFormProps = {
  // null — новая школа вместе с директором, иначе изменение данных школы.
  school: SystemSchool | null;
  onCreated: (result: SystemSchoolCreated) => void;
  onClose: () => void;
};

// Ошибки 422 backend → поля формы. Почта школы и почта директора приходят с одним
// именем поля «email», поэтому ошибка показывается у почты школы.
const apiFieldNames: Record<string, keyof SchoolFormValues> = {
  name: "name",
  email: "email",
  full_name: "directorName",
};

export function SchoolForm({ school, onCreated, onClose }: SchoolFormProps) {
  const t = useTranslations("system");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const createSchool = useCreateSystemSchool();
  const updateSchool = useUpdateSystemSchool();
  const isEditing = school !== null;
  const activeMutation = isEditing ? updateSchool : createSchool;

  // Правила схем SystemSchoolCreate и SchoolAdminCreate: название 2–200 символов,
  // почта директора — логин, ФИО — 3–200 символов.
  const directorRule = (rule: z.ZodString) => (isEditing ? z.string() : rule);
  const schoolSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, tForm("minLength", { count: 2 }))
      .max(200, tForm("maxLength", { count: 200 }))
      .superRefine(textRule(validateFreeText, (problem) => tChecks(problem))),
    email: z.union([z.literal(""), z.string().trim().email(t("errors.email"))]),
    directorEmail: isEditing ? z.string() : z.string().trim().pipe(z.email(tForm("emailFormat"))),
    directorName: directorRule(
      z
        .string()
        .trim()
        .min(3, tForm("minLength", { count: 3 }))
        .max(200, tForm("maxLength", { count: 200 }))
        .superRefine(textRule(validatePersonName, (problem) => tChecks(problem))),
    ),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: school?.name ?? "",
      email: school?.email ?? "",
      directorEmail: "",
      directorName: "",
    },
  });

  const showFieldErrors = (error: unknown) => {
    for (const [apiField, message] of Object.entries(getApiFieldErrors(error))) {
      const formField = apiFieldNames[apiField];
      if (formField) {
        setError(formField, { message });
      }
    }
  };

  const onSubmit = (values: SchoolFormValues) => {
    const schoolFields = {
      name: values.name.trim(),
      email: emptyToNull(values.email),
    };

    if (school) {
      updateSchool.mutate(
        { schoolId: school.id, data: schoolFields },
        { onSuccess: onClose, onError: showFieldErrors },
      );
      return;
    }

    createSchool.mutate(
      {
        ...schoolFields,
        director: {
          email: values.directorEmail.trim(),
          full_name: values.directorName.trim(),
        },
      },
      { onSuccess: onCreated, onError: showFieldErrors },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(activeMutation.error)).length > 0;
  const formError =
    activeMutation.isError && !hasFieldErrors ? handleApiError(activeMutation.error, tApiErrors) : null;

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

        <div className={cn(styles.field, styles.fieldWide)}>
          <label htmlFor="school-name">{t("fields.name")}</label>
          <input
            id="school-name"
            className={styles.input}
            placeholder={t("fields.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="school-email">{t("fields.email")}</label>
          <input
            id="school-email"
            type="email"
            className={styles.input}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className={styles.fieldError}>{errors.email.message}</p>
          ) : (
            <span className={styles.fieldHint}>{tForm("optional")}</span>
          )}
        </div>

        {!isEditing && (
          <>
            <h3 className={styles.formSectionTitle}>{t("directorSection")}</h3>
            <p className={styles.notice}>{t("directorNote")}</p>

            <div className={styles.field}>
              <label htmlFor="director-email">{t("fields.directorEmail")}</label>
              <input
                id="director-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder={tForm("emailPlaceholder")}
                className={styles.input}
                aria-invalid={Boolean(errors.directorEmail)}
                {...register("directorEmail")}
              />
              {errors.directorEmail && <p className={styles.fieldError}>{errors.directorEmail.message}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor="director-name">{t("fields.fullName")}</label>
              <input
                id="director-name"
                className={styles.input}
                aria-invalid={Boolean(errors.directorName)}
                {...register("directorName")}
              />
              {errors.directorName && (
                <p className={styles.fieldError}>{errors.directorName.message}</p>
              )}
            </div>
          </>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={activeMutation.isPending}>
            {activeMutation.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {isEditing ? tForm("save") : t("create")}
          </button>
        </div>
      </form>
    </section>
  );
}
