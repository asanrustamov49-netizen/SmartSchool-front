"use client";

import { CircleAlert, CircleCheck, ImageUp, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent } from "react";
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

// Картинка сохраняется сразу после выбора файла — как аватар в профиле.
// Раньше нужно было отдельно нажать «Сохранить»: если забыть, после возврата на страницу
// показывалась старая картинка, и казалось, что загрузка не сохраняется.
// Пока файл загружается, видно его превью.
function SchoolImageField({ imageType, savedUrl }: SchoolImageFieldProps) {
  const t = useTranslations("admin.school");
  const tApiErrors = useTranslations("apiErrors");
  const uploadImage = useUploadSchoolImage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Сброс, чтобы повторный выбор того же файла снова сработал.
    event.target.value = "";
    if (!file) {
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    uploadImage.mutate(
      { imageType, file },
      {
        onSettled: () => {
          setPreviewUrl(null);
          URL.revokeObjectURL(localUrl);
        },
      },
    );
  };

  const imageUrl = previewUrl ?? (savedUrl ? getMediaUrl(savedUrl) : null);

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
        {uploadImage.isPending && (
          <span className={styles.previewBadge}>
            <LoaderCircle className={styles.spinner} size={13} aria-hidden="true" />
            {t("saving")}
          </span>
        )}
      </div>
      <p className={styles.fieldHint}>{t(`imageHints.${imageType}`)}</p>

      {uploadImage.isError && (
        <p className={styles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(uploadImage.error, tApiErrors)}
        </p>
      )}
      {uploadImage.isSuccess && (
        <p className={styles.notice} role="status">
          <CircleCheck size={16} aria-hidden="true" />
          {t("imageSaved")}
        </p>
      )}

      <div className={styles.imageActions}>
        <label className={cn(styles.fileLabel, uploadImage.isPending && styles.fileLabelDisabled)}>
          <ImageUp size={16} aria-hidden="true" />
          {savedUrl ? t("replace") : t("upload")}
          <input type="file" accept="image/*" disabled={uploadImage.isPending} onChange={handleFileChange} />
        </label>
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
