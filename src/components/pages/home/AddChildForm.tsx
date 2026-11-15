"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, Info, LoaderCircle, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getParentLinkErrorKey } from "@/apis/parents.api";
import { useAddChild } from "@/hooks/useParents";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import scss from "./home.module.scss";

type AddChildFormValues = {
  studentInn: string;
  studentPassword: string;
};

type AddChildFormProps = {
  onAdded: (childId: number, fullName: string) => void;
  onCancel?: () => void;
};

// Привязка ещё одного ребёнка к аккаунту родителя: POST /parents/add-child.
export function AddChildForm({ onAdded, onCancel }: AddChildFormProps) {
  const t = useTranslations("parentLink");
  const tApiErrors = useTranslations("apiErrors");
  const addChildMutation = useAddChild();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const addChildSchema = z.object({
    studentInn: z.string().trim().regex(/^\d{14}$/, t("errors.innDigits")),
    studentPassword: z.string().min(1, t("errors.childPasswordRequired")),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddChildFormValues>({
    resolver: zodResolver(addChildSchema),
    defaultValues: { studentInn: "", studentPassword: "" },
  });

  const onSubmit = (values: AddChildFormValues) => {
    addChildMutation.mutate(
      { student_inn: values.studentInn.trim(), student_password: values.studentPassword },
      {
        onSuccess: (response) => {
          reset();
          onAdded(response.student_id, response.full_name);
        },
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.student_inn) {
            setError("studentInn", { message: fieldErrors.student_inn });
          }
          if (fieldErrors.student_password) {
            setError("studentPassword", { message: fieldErrors.student_password });
          }
        },
      },
    );
  };

  const getFormError = (error: Error) => {
    const errorKey = getParentLinkErrorKey(error);
    return errorKey ? t(`errors.${errorKey}`) : handleApiError(error, tApiErrors);
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(addChildMutation.error)).length > 0;
  const formError =
    addChildMutation.isError && !hasFieldErrors ? getFormError(addChildMutation.error) : null;

  return (
    <form className={cn(adminStyles.form, scss.addChildForm)} onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className={adminStyles.notice}>
        <Info size={16} aria-hidden="true" />
        {t("childNote")}
      </p>

      {formError && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {formError}
        </p>
      )}

      <div className={adminStyles.field}>
        <label htmlFor="add-child-inn">{t("childInn")}</label>
        <input
          id="add-child-inn"
          className={adminStyles.input}
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          placeholder="00000000000000"
          aria-invalid={Boolean(errors.studentInn)}
          {...register("studentInn")}
        />
        {errors.studentInn && <p className={adminStyles.fieldError}>{errors.studentInn.message}</p>}
      </div>

      <div className={adminStyles.field}>
        <label htmlFor="add-child-password">{t("childPassword")}</label>
        <div className={scss.passwordInput}>
          <input
            id="add-child-password"
            className={adminStyles.input}
            type={passwordVisible ? "text" : "password"}
            autoComplete="off"
            aria-invalid={Boolean(errors.studentPassword)}
            {...register("studentPassword")}
          />
          <button
            type="button"
            aria-label={passwordVisible ? t("hidePassword") : t("showPassword")}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
        {errors.studentPassword && (
          <p className={adminStyles.fieldError}>{errors.studentPassword.message}</p>
        )}
      </div>

      <div className={adminStyles.formActions}>
        {onCancel && (
          <button type="button" className={adminStyles.secondaryButton} onClick={onCancel}>
            {t("cancel")}
          </button>
        )}
        <button type="submit" className={adminStyles.primaryButton} disabled={addChildMutation.isPending}>
          {addChildMutation.isPending ? (
            <LoaderCircle className={scss.spin} size={16} aria-hidden="true" />
          ) : (
            <UserPlus size={16} aria-hidden="true" />
          )}
          {addChildMutation.isPending ? t("adding") : t("addChild")}
        </button>
      </div>
    </form>
  );
}
