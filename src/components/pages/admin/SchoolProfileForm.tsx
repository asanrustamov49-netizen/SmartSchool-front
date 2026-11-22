"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { School } from "@/apis/schools.api";
import { useUpdateMySchool } from "@/hooks/useSchool";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import styles from "./admin.module.scss";

type SchoolFormValues = {
  name: string;
  email: string;
  director_name: string;
};

const FIELDS: { name: keyof SchoolFormValues; type: string }[] = [
  { name: "name", type: "text" },
  { name: "director_name", type: "text" },
  { name: "email", type: "email" },
];

export function SchoolProfileForm({ school }: { school: School }) {
  const t = useTranslations("admin.school");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const updateSchool = useUpdateMySchool();

  // Правила из схемы SchoolUpdate: name — от 2 до 200 символов, остальные поля без ограничений.
  const schoolSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, tForm("minLength", { count: 2 }))
      .max(200, tForm("maxLength", { count: 200 })),
    email: z.string(),
    director_name: z.string(),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: school.name,
      email: school.email ?? "",
      director_name: school.director_name ?? "",
    },
  });

  const onSubmit = (values: SchoolFormValues) => {
    updateSchool.mutate(
      {
        name: values.name.trim(),
        email: emptyToNull(values.email),
        director_name: emptyToNull(values.director_name),
      },
      {
        onSuccess: (updatedSchool) =>
          reset({
            name: updatedSchool.name,
            email: updatedSchool.email ?? "",
            director_name: updatedSchool.director_name ?? "",
          }),
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);

          for (const field of FIELDS) {
            const message = fieldErrors[field.name];

            if (message) {
              setError(field.name, { message });
            }
          }
        },
      },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(updateSchool.error)).length > 0;
  const formError =
    updateSchool.isError && !hasFieldErrors
      ? handleApiError(updateSchool.error, tApiErrors)
      : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("infoTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}
        {updateSchool.isSuccess && !isDirty && (
          <p className={styles.notice} role="status">
            <CircleCheck size={16} aria-hidden="true" />
            {tForm("saved")}
          </p>
        )}

        {FIELDS.map((field) => {
          const error = errors[field.name];

          return (
            <div key={field.name} className={styles.field}>
              <label htmlFor={`school-${field.name}`}>{t(`fields.${field.name}`)}</label>
              <input
                id={`school-${field.name}`}
                className={styles.input}
                type={field.type}
                aria-invalid={Boolean(error)}
                {...register(field.name)}
              />
              {error && <p className={styles.fieldError}>{error.message}</p>}
            </div>
          );
        })}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={updateSchool.isPending || !isDirty}
          >
            {updateSchool.isPending && <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
