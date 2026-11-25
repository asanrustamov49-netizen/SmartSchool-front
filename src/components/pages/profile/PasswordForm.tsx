"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useChangePassword } from "@/hooks/useProfile";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { isStrongPassword } from "@/lib/textChecks";
import styles from "../admin/admin.module.scss";

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function PasswordForm() {
  const t = useTranslations("profile.password");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tAuth = useTranslations("auth");
  const changePassword = useChangePassword();
  // Какие поля сейчас показывают пароль открытым текстом (у каждого поля своя кнопка).
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  // Правила из схемы PasswordChange: new_password — от 8 до 128 символов.
  // Повтор пароля проверяется только на клиенте.
  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, tForm("required")),
      newPassword: z
        .string()
        .min(8, t("newPasswordMin"))
        .max(128, tForm("maxLength", { count: 128 }))
        .refine(isStrongPassword, tAuth("errors.weakPassword")),
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t("mismatch"),
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: PasswordFormValues) => {
    changePassword.mutate(
      { current_password: values.currentPassword, new_password: values.newPassword },
      {
        onSuccess: () => reset(),
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.new_password) {
            setError("newPassword", { message: fieldErrors.new_password });
          }
        },
      },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(changePassword.error)).length > 0;
  const formError =
    changePassword.isError && !hasFieldErrors
      ? handleApiError(changePassword.error, tApiErrors)
      : null;

  const fields = [
    { name: "currentPassword", autoComplete: "current-password" },
    { name: "newPassword", autoComplete: "new-password" },
    { name: "confirmPassword", autoComplete: "new-password" },
  ] as const;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("title")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        {changePassword.isSuccess && (
          <p className={styles.notice} role="status">
            <CircleCheck size={16} aria-hidden="true" />
            {t("changed")}
          </p>
        )}

        {fields.map((field) => (
          <div key={field.name} className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor={`password-${field.name}`}>{t(field.name)}</label>
            <div className={styles.passwordWrap}>
              <input
                id={`password-${field.name}`}
                type={visibleFields[field.name] ? "text" : "password"}
                autoComplete={field.autoComplete}
                className={styles.input}
                aria-invalid={Boolean(errors[field.name])}
                {...register(field.name)}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={visibleFields[field.name] ? tAuth("hidePassword") : tAuth("showPassword")}
                aria-pressed={Boolean(visibleFields[field.name])}
                onClick={() =>
                  setVisibleFields((current) => ({ ...current, [field.name]: !current[field.name] }))
                }
              >
                {visibleFields[field.name] ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Eye size={17} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors[field.name] && (
              <p className={styles.fieldError}>{errors[field.name]?.message}</p>
            )}
          </div>
        ))}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={changePassword.isPending}
          >
            {changePassword.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {t("submit")}
          </button>
        </div>
      </form>
    </section>
  );
}
