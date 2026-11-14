"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, IdCard, LoaderCircle, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";
import { useRouter } from "@/i18n/navigation";
import { getApiErrorStatus, getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { AuthLayout } from "./AuthLayout";
import styles from "./login.module.scss";

type LoginFormValues = {
  inn: string;
  password: string;
};

const Login = () => {
  const t = useTranslations("auth");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const loginMutation = useLogin();
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Правила совпадают со схемой LoginRequest: inn — ровно 14 символов, password — не пустой.
  const loginSchema = z.object({
    inn: z.string().trim().length(14, t("errors.innLength")),
    password: z.string().min(1, t("errors.passwordRequired")),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { inn: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (tokenResponse) => {
        if (tokenResponse.requires_password_change) {
          router.replace("/change-password");
          return;
        }

        router.replace("/");
      },
      onError: (error) => {
        const fieldErrors = getApiFieldErrors(error);

        if (fieldErrors.inn) {
          setError("inn", { message: fieldErrors.inn });
        }

        if (fieldErrors.password) {
          setError("password", { message: fieldErrors.password });
        }
      },
    });
  };

  // Backend отвечает на /auth/login только по-кыргызски, поэтому известные статусы
  // показываются своим переводом: 401 — неверный ИНН или пароль, 403 — аккаунт закрыт.
  const getLoginErrorMessage = (error: Error) => {
    const status = getApiErrorStatus(error);

    if (status === 401) {
      return t("errors.invalidCredentials");
    }

    if (status === 403) {
      return t("errors.accountDisabled");
    }

    return handleApiError(error, tApiErrors);
  };

  const isSubmitting = loginMutation.isPending || loginMutation.isSuccess;
  const hasFieldErrors = Object.keys(getApiFieldErrors(loginMutation.error)).length > 0;
  const formError =
    loginMutation.isError && !hasFieldErrors
      ? getLoginErrorMessage(loginMutation.error)
      : null;

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")} showBackLink>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <Label htmlFor="inn" className={styles.label}>
            {t("inn")}
          </Label>
          <div className={styles.inputWrap}>
            <IdCard className={styles.inputIcon} size={18} aria-hidden="true" />
            <Input
              id="inn"
              className={styles.input}
              inputMode="numeric"
              autoComplete="username"
              maxLength={14}
              placeholder={t("innPlaceholder")}
              aria-invalid={Boolean(errors.inn)}
              aria-describedby={errors.inn ? "inn-error" : undefined}
              {...register("inn")}
            />
          </div>
          {errors.inn && (
            <p id="inn-error" className={styles.fieldError}>
              {errors.inn.message}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <Label htmlFor="password" className={styles.label}>
            {t("password")}
          </Label>
          <div className={styles.passwordWrap}>
            <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
            <Input
              id="password"
              className={styles.input}
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              aria-label={passwordVisible ? t("hidePassword") : t("showPassword")}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className={styles.fieldError}>
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting && (
            <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
          )}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
