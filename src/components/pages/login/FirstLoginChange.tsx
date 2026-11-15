"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, LoaderCircle, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
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

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  error: string | undefined;
  registration: UseFormRegisterReturn;
};

// Поле пароля с кнопкой «показать / скрыть», как на странице входа.
function PasswordField({ id, label, autoComplete, error, registration }: PasswordFieldProps) {
  const tAuth = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <Label htmlFor={id} className={styles.label}>
        {label}
      </Label>
      <div className={styles.passwordWrap}>
        <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
        <Input
          id={id}
          className={styles.input}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={visible ? tAuth("hidePassword") : tAuth("showPassword")}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

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
