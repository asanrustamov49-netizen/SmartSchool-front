"use client";

import { CircleAlert, CircleCheck, ImageUp, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ChangeEvent } from "react";
import type { School, SchoolImageType } from "@/apis/schools.api";
import { useUploadSchoolImage } from "@/hooks/useSchool";
import { handleApiError } from "@/lib/errorHandler";
import { cn, getMediaUrl } from "@/lib/utils";
import styles from "./admin.module.scss";

const IMAGE_TYPES: SchoolImageType[] = ["logo", "banner"];

type SchoolImageFieldProps = {
  imageType: SchoolImageType;
  savedUrl: string | null;
};

// Выбранный файл сначала показывается как превью и уходит на сервер
// только по кнопке «Сохранить».
function SchoolImageField({ imageType, savedUrl }: SchoolImageFieldProps) {
  const t = useTranslations("admin.school");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const uploadImage = useUploadSchoolImage();
  const [pending, setPending] = useState<{ file: File; previewUrl: string } | null>(null);
  const pendingFile = pending?.file ?? null;

  // Временная ссылка на выбранный файл освобождается, когда превью больше не нужно.
  useEffect(() => {
    return () => {
      if (pending) {
        URL.revokeObjectURL(pending.previewUrl);
      }
    };
  }, [pending]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Сброс, чтобы повторный выбор того же файла снова сработал.
    event.target.value = "";
    uploadImage.reset();

    if (file) {
      setPending({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleSave = () => {
    if (!pending) {
      return;
    }

    uploadImage.mutate({ imageType, file: pending.file }, { onSuccess: () => setPending(null) });
  };

  const imageUrl = pending?.previewUrl ?? (savedUrl ? getMediaUrl(savedUrl) : null);

  return (
    <div className={styles.field}>
      <span>{t(`images.${imageType}`)}</span>
      <div className={cn(styles.imagePreview, imageType === "banner" && styles.imagePreviewBanner)}>
        {imageUrl ? (
          // Файл лежит на сервере API или выбран локально, поэтому обычный img без next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={t(`images.${imageType}`)} />
        ) : (
          t("noImage")
        )}
        {pendingFile && <span className={styles.previewBadge}>{t("unsaved")}</span>}
      </div>
      <p className={styles.fieldHint}>{t(`imageHints.${imageType}`)}</p>

      {uploadImage.isError && (
        <p className={styles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(uploadImage.error, tApiErrors)}
        </p>
      )}
      {uploadImage.isSuccess && !pendingFile && (
        <p className={styles.notice} role="status">
          <CircleCheck size={16} aria-hidden="true" />
          {t("imageSaved")}
        </p>
      )}

      <div className={styles.imageActions}>
        <label className={styles.fileLabel}>
          <ImageUp size={16} aria-hidden="true" />
          {pendingFile ? t("chooseAnother") : t("upload")}
          <input
            type="file"
            accept="image/*"
            disabled={uploadImage.isPending}
            onChange={handleFileChange}
          />
        </label>

        {pendingFile && (
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={uploadImage.isPending}
              onClick={() => setPending(null)}
            >
              {tForm("cancel")}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={uploadImage.isPending}
              onClick={handleSave}
            >
              {uploadImage.isPending && (
                <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
              )}
              {tForm("save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function SchoolImages({ school }: { school: School }) {
  const t = useTranslations("admin.school");

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("imagesTitle")}</h2>
      <div className={styles.imageRow}>
        {IMAGE_TYPES.map((imageType) => (
          <SchoolImageField
            key={imageType}
            imageType={imageType}
            savedUrl={imageType === "logo" ? school.logo_url : school.banner_url}
          />
        ))}
      </div>
    </section>
  );
}
