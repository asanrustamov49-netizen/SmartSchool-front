"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser, useFirstLoginChange, useLogout } from "@/hooks/useAuth";
import { useRouter } from "@/i18n/navigation";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { AuthLayout } from "./AuthLayout";
import styles from "./login.module.scss";

type FirstLoginChangeFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const FirstLoginChange = () => {
  const t = useTranslations("auth.firstLogin");
  const tCommon = useTranslations("common");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const logout = useLogout();
  const currentUserQuery = useCurrentUser();
  const changePasswordMutation = useFirstLoginChange();

  // Правила из схемы FirstLoginChange: new_password — минимум 8 символов.
  // Повтор пароля проверяется только на клиенте.
  const firstLoginChangeSchema = z
    .object({
      currentPassword: z.string().min(1, t("errors.currentRequired")),
      newPassword: z.string().min(8, t("errors.newPasswordMin")),
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t("errors.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FirstLoginChangeFormValues>({
    resolver: zodResolver(firstLoginChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const passwordAlreadyChanged = currentUserQuery.data?.is_temp_password === false;

  useEffect(() => {
    if (passwordAlreadyChanged) {
      router.replace("/");
    }
  }, [passwordAlreadyChanged, router]);

  const onSubmit = (values: FirstLoginChangeFormValues) => {
    changePasswordMutation.mutate(
      {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      },
      {
        onSuccess: () => router.replace("/"),
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);

          if (fieldErrors.current_password) {
            setError("currentPassword", { message: fieldErrors.current_password });
          }

          if (fieldErrors.new_password) {
            setError("newPassword", { message: fieldErrors.new_password });
          }
        },
      },
    );
  };

  if (currentUserQuery.isPending || passwordAlreadyChanged) {
    return (
      <AuthLayout title={t("title")} subtitle={t("description")}>
        <p className={styles.loading}>
          <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
          {tCommon("loading")}
        </p>
      </AuthLayout>
    );
  }

  const isSubmitting = changePasswordMutation.isPending || changePasswordMutation.isSuccess;
  const hasFieldErrors =
    Object.keys(getApiFieldErrors(changePasswordMutation.error)).length > 0;
  const formError =
    changePasswordMutation.isError && !hasFieldErrors
      ? handleApiError(changePasswordMutation.error, tApiErrors)
      : null;

  return (
    <AuthLayout title={t("title")} subtitle={t("description")}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <Label htmlFor="current-password" className={styles.label}>
            {t("currentPassword")}
          </Label>
          <Input
            id="current-password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className={styles.fieldError}>{errors.currentPassword.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <Label htmlFor="new-password" className={styles.label}>
            {t("newPassword")}
          </Label>
          <Input
            id="new-password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className={styles.fieldError}>{errors.newPassword.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <Label htmlFor="confirm-password" className={styles.label}>
            {t("confirmPassword")}
          </Label>
          <Input
            id="confirm-password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className={styles.fieldError}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting && (
            <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
          )}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>

        <button type="button" className={styles.secondaryButton} onClick={logout}>
          {t("otherAccount")}
        </button>
      </form>
    </AuthLayout>
  );
};

export default FirstLoginChange;
