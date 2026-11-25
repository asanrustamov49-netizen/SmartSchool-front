"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useFirstLoginChange, useLogout } from "@/hooks/useAuth";
import { useRouter } from "@/i18n/navigation";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { isStrongPassword } from "@/lib/textChecks";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import styles from "./login.module.scss";

type FirstLoginChangeFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const FirstLoginChange = () => {
  const t = useTranslations("auth.firstLogin");
  const tAuth = useTranslations("auth");
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
      newPassword: z.string().min(8, t("errors.newPasswordMin")).refine(isStrongPassword, tAuth("errors.weakPassword")),
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

        <PasswordField
          id="current-password"
          label={t("currentPassword")}
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          registration={register("currentPassword")}
        />
        <PasswordField
          id="new-password"
          label={t("newPassword")}
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={register("newPassword")}
        />
        <PasswordField
          id="confirm-password"
          label={t("confirmPassword")}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

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
