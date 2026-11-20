"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, ImageUp, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AUDIENCE_GROUPS, type Announcement, type AudienceGroup } from "@/apis/announcements.api";
import { useSaveAnnouncement } from "@/hooks/useAnnouncements";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { textRule, validateFreeText } from "@/lib/textChecks";
import { cn } from "@/lib/utils";
import styles from "../admin/admin.module.scss";
import announcementStyles from "./announcements.module.scss";

type AnnouncementFormValues = {
  title: string;
  body: string;
  event_date: string;
};

type AnnouncementFormProps = {
  announcement: Announcement | null;
  onClose: () => void;
};

export function AnnouncementForm({ announcement, onClose }: AnnouncementFormProps) {
  const t = useTranslations("announcements");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const saveAnnouncement = useSaveAnnouncement();
  const [image, setImage] = useState<File | null>(null);
  const isEditing = announcement !== null;

  // Правила backend: title — от 2 до 200 символов.
  const announcementSchema = z.object({
    title: z
      .string()
      .trim()
      .min(2, tForm("minLength", { count: 2 }))
      .max(200, tForm("maxLength", { count: 200 }))
      .superRefine(textRule(validateFreeText, (problem) => tChecks(problem))),
    body: z.string().superRefine(textRule(validateFreeText, (problem) => tChecks(problem))),
    event_date: z.string(),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title ?? "",
      body: announcement?.body ?? "",
      event_date: announcement?.event_date ?? "",
    },
  });

  // Пустой список = «Всем». Если выбраны все группы — это тоже «Всем».
  const [audience, setAudience] = useState<AudienceGroup[]>(announcement?.audience ?? []);
  const toggleGroup = (group: AudienceGroup) => {
    setAudience((current) => {
      const next = current.includes(group) ? current.filter((item) => item !== group) : [...current, group];
      return next.length === AUDIENCE_GROUPS.length ? [] : next;
    });
  };

  const onSubmit = (values: AnnouncementFormValues) => {
    saveAnnouncement.mutate(
      { announcementId: announcement?.id ?? null, data: { ...values, audience, image } },
      {
        onSuccess: onClose,
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.title) {
            setError("title", { message: fieldErrors.title });
          }
        },
      },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(saveAnnouncement.error)).length > 0;
  const formError =
    saveAnnouncement.isError && !hasFieldErrors
      ? handleApiError(saveAnnouncement.error, tApiErrors)
      : null;

  const imageButtonText =
    image?.name ?? (announcement?.image_url ? t("replaceImage") : t("chooseImage"));

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{isEditing ? t("editTitle") : t("createTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="announcement-title">{t("titleLabel")}</label>
          <input
            id="announcement-title"
            className={styles.input}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && <p className={styles.fieldError}>{errors.title.message}</p>}
        </div>

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="announcement-body">{t("bodyLabel")}</label>
          <textarea
            id="announcement-body"
            rows={4}
            className={`${styles.input} ${styles.textarea}`}
            {...register("body")}
          />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="announcement-date">{t("dateLabel")}</label>
          <input
            id="announcement-date"
            type="date"
            className={styles.input}
            {...register("event_date")}
          />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
        </div>

        <div className={styles.field}>
          <span>{t("imageLabel")}</span>
          <label className={styles.fileLabel}>
            <ImageUp size={16} aria-hidden="true" />
            {imageButtonText}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {isEditing && <p className={styles.fieldHint}>{t("partialUpdateHint")}</p>}

        <fieldset className={announcementStyles.audienceField}>
          <legend>{t("audience")}</legend>
          <div className={announcementStyles.chips}>
            <button
              type="button"
              aria-pressed={audience.length === 0}
              className={cn(announcementStyles.chip, audience.length === 0 && announcementStyles.chipActive)}
              onClick={() => setAudience([])}
            >
              {t("audienceAll")}
            </button>
            {AUDIENCE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={audience.includes(group)}
                className={cn(announcementStyles.chip, audience.includes(group) && announcementStyles.chipActive)}
                onClick={() => toggleGroup(group)}
              >
                {t(`audienceGroups.${group}`)}
              </button>
            ))}
          </div>
          <p className={styles.fieldHint}>{t("audienceHint")}</p>
        </fieldset>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={saveAnnouncement.isPending}
          >
            {saveAnnouncement.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {isEditing ? tForm("save") : t("publish")}
          </button>
        </div>
      </form>
    </section>
  );
}
