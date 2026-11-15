"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CurrentUser } from "@/apis/auth.api";
import { useUpdateProfile } from "@/hooks/useProfile";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import styles from "../admin/admin.module.scss";

type ProfileFormValues = {
  fullName: string;
  phone: string;
};

// Backend разрешает менять ФИО только директору, завучу и родителю.
const ROLES_WITH_EDITABLE_NAME = ["DIRECTOR", "DEPUTY", "PARENT"];

export function ProfileForm({ user }: { user: CurrentUser }) {
  const t = useTranslations("profile");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const updateProfile = useUpdateProfile();
  const canEditName = ROLES_WITH_EDITABLE_NAME.includes(user.role);

  // Правила из схемы ProfileUpdate: full_name — 3–200 символов, phone — до 20.
  const profileSchema = z.object({
    fullName: z
      .string()
      .trim()
      .min(3, tForm("minLength", { count: 3 }))
      .max(200, tForm("maxLength", { count: 200 })),
    phone: z.string().trim().max(20, tForm("maxLength", { count: 20 })),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.full_name, phone: user.phone ?? "" },
  });

  const onSubmit = (values: ProfileFormValues) => {
    const phone = emptyToNull(values.phone);
    const data = canEditName ? { full_name: values.fullName.trim(), phone } : { phone };

    updateProfile.mutate(data, {
      onSuccess: () => reset(values),
      onError: (error) => {
        const fieldErrors = getApiFieldErrors(error);
        if (fieldErrors.full_name) {
          setError("fullName", { message: fieldErrors.full_name });
        }
        if (fieldErrors.phone) {
          setError("phone", { message: fieldErrors.phone });
        }
      },
    });
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(updateProfile.error)).length > 0;
  const formError =
    updateProfile.isError && !hasFieldErrors
      ? handleApiError(updateProfile.error, tApiErrors)
      : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("dataTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        {updateProfile.isSuccess && !isDirty && (
          <p className={styles.notice} role="status">
            <CircleCheck size={16} aria-hidden="true" />
            {tForm("saved")}
          </p>
        )}

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="profile-name">{t("fullName")}</label>
          <input
            id="profile-name"
            className={styles.input}
            readOnly={!canEditName}
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {!canEditName && <span className={styles.fieldHint}>{t("nameReadonly")}</span>}
          {errors.fullName && <p className={styles.fieldError}>{errors.fullName.message}</p>}
        </div>

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="profile-phone">{t("phone")}</label>
          <input
            id="profile-phone"
            type="tel"
            className={styles.input}
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
          {errors.phone && <p className={styles.fieldError}>{errors.phone.message}</p>}
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!isDirty || updateProfile.isPending}
          >
            {updateProfile.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
