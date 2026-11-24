"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Info, LoaderCircle, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getParentLinkErrorKey, isParentCode, normalizeParentCode } from "@/apis/parents.api";
import { useAddChild } from "@/hooks/useParents";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import scss from "./home.module.scss";

type AddChildFormValues = {
  studentCode: string;
};

type AddChildFormProps = {
  onAdded: (childId: number, fullName: string) => void;
  onCancel?: () => void;
};

// Привязка ещё одного ребёнка к аккаунту родителя по коду от классного руководителя.
export function AddChildForm({ onAdded, onCancel }: AddChildFormProps) {
  const t = useTranslations("parentLink");
  const tApiErrors = useTranslations("apiErrors");
  const addChildMutation = useAddChild();

  const addChildSchema = z.object({
    studentCode: z.string().refine(isParentCode, t("errors.codeFormat")),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddChildFormValues>({
    resolver: zodResolver(addChildSchema),
    defaultValues: { studentCode: "" },
  });

  const onSubmit = (values: AddChildFormValues) => {
    addChildMutation.mutate(
      { student_code: normalizeParentCode(values.studentCode) },
      {
        onSuccess: (response) => {
          reset();
          onAdded(response.student_id, response.full_name);
        },
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.student_code) {
            setError("studentCode", { message: fieldErrors.student_code });
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
        <label htmlFor="add-child-code">{t("childCode")}</label>
        <input
          id="add-child-code"
          className={adminStyles.input}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={t("childCodePlaceholder")}
          aria-invalid={Boolean(errors.studentCode)}
          {...register("studentCode")}
        />
        {errors.studentCode && <p className={adminStyles.fieldError}>{errors.studentCode.message}</p>}
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
