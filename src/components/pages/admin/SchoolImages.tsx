"use client";

import { CircleAlert, ImageUp, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import type { School, SchoolImageType } from "@/apis/schools.api";
import { useUploadSchoolImage } from "@/hooks/useSchool";
import { handleApiError } from "@/lib/errorHandler";
import { getMediaUrl } from "@/lib/utils";
import styles from "./admin.module.scss";

const IMAGE_TYPES: SchoolImageType[] = ["logo", "banner"];

export function SchoolImages({ school }: { school: School }) {
  const t = useTranslations("admin.school");
  const tApiErrors = useTranslations("apiErrors");
  const uploadImage = useUploadSchoolImage();

  const handleFileChange = (imageType: SchoolImageType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Сброс, чтобы повторный выбор того же файла снова вызвал загрузку.
    event.target.value = "";

    if (file) {
      uploadImage.mutate({ imageType, file });
    }
  };

  const uploadingType = uploadImage.isPending ? uploadImage.variables.imageType : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("imagesTitle")}</h2>

      {uploadImage.isError && (
        <p className={styles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(uploadImage.error, tApiErrors)}
        </p>
      )}

      <div className={styles.imageRow}>
        {IMAGE_TYPES.map((imageType) => {
          const imageUrl = imageType === "logo" ? school.logo_url : school.banner_url;

          return (
            <div key={imageType} className={styles.field}>
              <span>{t(`images.${imageType}`)}</span>
              <div className={styles.imagePreview}>
                {imageUrl ? (
                  // Файл лежит на сервере API, поэтому обычный img без оптимизации next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getMediaUrl(imageUrl)} alt={t(`images.${imageType}`)} />
                ) : (
                  t("noImage")
                )}
              </div>
              <label className={styles.fileLabel}>
                {uploadingType === imageType ? (
                  <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
                ) : (
                  <ImageUp size={16} aria-hidden="true" />
                )}
                {t("upload")}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadImage.isPending}
                  onChange={(event) => handleFileChange(imageType, event)}
                />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
