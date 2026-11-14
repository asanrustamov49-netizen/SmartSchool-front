"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateSubject } from "@/hooks/useSubjects";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import styles from "./admin.module.scss";

type SubjectFormValues = {
  name: string;
  code: string;
};

// Backend позволяет только создать предмет: endpoint'ов изменения и удаления нет.
export function SubjectForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("admin.subjects");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const createSubject = useCreateSubject();

  // Правила из схемы SubjectCreate: name — от 2 до 100 символов.
  const subjectSchema = z.object({
    name: z.string().trim().min(2, tForm("minLength", { count: 2 })).max(100, tForm("maxLength", { count: 100 })),
    code: z.string(),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", code: "" },
  });

  const onSubmit = (values: SubjectFormValues) => {
    createSubject.mutate(
      { name: values.name.trim(), code: emptyToNull(values.code) },
      {
        onSuccess: onClose,
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);

          if (fieldErrors.name) {
            setError("name", { message: fieldErrors.name });
          }

          if (fieldErrors.code) {
            setError("code", { message: fieldErrors.code });
          }
        },
      },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(createSubject.error)).length > 0;
  const formError =
    createSubject.isError && !hasFieldErrors
      ? handleApiError(createSubject.error, tApiErrors)
      : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("createTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="subject-name">{t("name")}</label>
          <input
            id="subject-name"
            className={styles.input}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="subject-code">{t("code")}</label>
          <input
            id="subject-code"
            className={styles.input}
            aria-invalid={Boolean(errors.code)}
            {...register("code")}
          />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
          {errors.code && <p className={styles.fieldError}>{errors.code.message}</p>}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={createSubject.isPending}
          >
            {createSubject.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
