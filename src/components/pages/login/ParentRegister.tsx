"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Baby,
  CircleAlert,
  IdCard,
  Info,
  LoaderCircle,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { getParentLinkErrorKey } from "@/apis/parents.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterParent } from "@/hooks/useParents";
import { Link, useRouter } from "@/i18n/navigation";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { textRule, validatePersonName } from "@/lib/textChecks";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import styles from "./login.module.scss";

type ParentRegisterFormValues = {
  fullName: string;
  inn: string;
  phone: string;
  password: string;
  confirmPassword: string;
  studentInn: string;
  studentPassword: string;
};

type TextFieldProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  error: string | undefined;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "text";
  autoComplete?: string;
  maxLength?: number;
};

function TextField({ id, label, icon: Icon, error, registration, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <Label htmlFor={id} className={styles.label}>
        {label}
      </Label>
      <div className={styles.inputWrap}>
        <Icon className={styles.inputIcon} size={18} aria-hidden="true" />
        <Input
          id={id}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
          {...registration}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

// Поля формы → поля схемы ParentRegister, чтобы показать ошибки 422 у нужного поля.
const apiFieldNames: Record<string, keyof ParentRegisterFormValues> = {
  full_name: "fullName",
  inn: "inn",
  phone: "phone",
  password: "password",
  student_inn: "studentInn",
  student_password: "studentPassword",
};

const ParentRegister = () => {
  const t = useTranslations("parentLink");
  const tAuth = useTranslations("auth");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const router = useRouter();
  const registerMutation = useRegisterParent();

  // Правила совпадают со схемой ParentRegister: ИНН — 14 цифр, пароль — от 8 символов.
  const innRule = z.string().trim().regex(/^\d{14}$/, t("errors.innDigits"));
  const registerSchema = z
    .object({
      fullName: z
        .string()
        .trim()
        .min(3, t("errors.fullNameMin"))
        .superRefine(textRule(validatePersonName, (problem) => tChecks(problem))),
      inn: innRule,
      phone: z.string().trim().max(20, t("errors.phoneMax")),
      password: z.string().min(8, t("errors.passwordMin")),
      confirmPassword: z.string(),
      studentInn: innRule,
      studentPassword: z.string().min(1, t("errors.childPasswordRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t("errors.passwordsMismatch"),
      path: ["confirmPassword"],
    })
    .refine((values) => values.inn !== values.studentInn, {
      message: t("errors.sameInn"),
      path: ["studentInn"],
    });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ParentRegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      inn: "",
      phone: "",
      password: "",
      confirmPassword: "",
      studentInn: "",
      studentPassword: "",
    },
  });

  const onSubmit = (values: ParentRegisterFormValues) => {
    registerMutation.mutate(
      {
        full_name: values.fullName.trim(),
        inn: values.inn.trim(),
        phone: values.phone.trim() || null,
        password: values.password,
        student_inn: values.studentInn.trim(),
        student_password: values.studentPassword,
      },
      {
        onSuccess: () => router.replace("/"),
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);

          for (const [apiField, message] of Object.entries(fieldErrors)) {
            const formField = apiFieldNames[apiField];
            if (formField) {
              setError(formField, { message });
            }
          }
        },
      },
    );
  };

  const getFormError = (error: Error) => {
    const errorKey = getParentLinkErrorKey(error);
    return errorKey ? t(`errors.${errorKey}`) : handleApiError(error, tApiErrors);
  };

  const isSubmitting = registerMutation.isPending || registerMutation.isSuccess;
  const hasFieldErrors = Object.keys(getApiFieldErrors(registerMutation.error)).length > 0;
  const formError =
    registerMutation.isError && !hasFieldErrors ? getFormError(registerMutation.error) : null;

  return (
    <AuthLayout title={t("registerTitle")} subtitle={t("registerSubtitle")} showBackLink>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>
            <UserRound size={17} aria-hidden="true" />
            {t("parentSection")}
          </legend>
          <TextField
            id="parent-full-name"
            label={t("fullName")}
            icon={UserRound}
            autoComplete="name"
            placeholder={t("fullNamePlaceholder")}
            error={errors.fullName?.message}
            registration={register("fullName")}
          />
          <TextField
            id="parent-inn"
            label={t("parentInn")}
            icon={IdCard}
            inputMode="numeric"
            autoComplete="username"
            maxLength={14}
            placeholder={tAuth("innPlaceholder")}
            error={errors.inn?.message}
            registration={register("inn")}
          />
          <TextField
            id="parent-phone"
            label={t("phone")}
            icon={Phone}
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="+996 700 000 000"
            error={errors.phone?.message}
            registration={register("phone")}
          />
          <PasswordField
            id="parent-password"
            label={t("password")}
            autoComplete="new-password"
            hint={t("passwordHint")}
            error={errors.password?.message}
            registration={register("password")}
          />
          <PasswordField
            id="parent-confirm-password"
            label={t("confirmPassword")}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
          />
        </fieldset>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>
            <Baby size={17} aria-hidden="true" />
            {t("childSection")}
          </legend>
          <p className={styles.infoNote}>
            <Info size={16} aria-hidden="true" />
            {t("childNote")}
          </p>
          <TextField
            id="child-inn"
            label={t("childInn")}
            icon={IdCard}
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder={tAuth("innPlaceholder")}
            error={errors.studentInn?.message}
            registration={register("studentInn")}
          />
          <PasswordField
            id="child-password"
            label={t("childPassword")}
            autoComplete="off"
            error={errors.studentPassword?.message}
            registration={register("studentPassword")}
          />
        </fieldset>

        <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />}
          {isSubmitting ? t("registering") : t("register")}
        </Button>

        <p className={styles.switchAuth}>
          {t("haveAccount")}
          <Link href="/login">{tAuth("login")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ParentRegister;
