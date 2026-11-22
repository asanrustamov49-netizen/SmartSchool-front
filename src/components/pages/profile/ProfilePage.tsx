"use client";

import { CircleAlert, ImageUp, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUploadAvatar } from "@/hooks/useProfile";
import { handleApiError } from "@/lib/errorHandler";
import { getMediaUrl } from "@/lib/utils";
import { PasswordForm } from "./PasswordForm";
import { ProfileForm } from "./ProfileForm";
import adminStyles from "../admin/admin.module.scss";
import styles from "./profile.module.scss";

export function ProfilePage() {
  const t = useTranslations("profile");
  const tRole = useTranslations("app.role");
  const tApiErrors = useTranslations("apiErrors");
  const currentUserQuery = useCurrentUser();
  const uploadAvatar = useUploadAvatar();

  if (currentUserQuery.isPending) {
    return <DataState status="loading" />;
  }

  if (currentUserQuery.isError) {
    return (
      <DataState
        status="error"
        message={handleApiError(currentUserQuery.error, tApiErrors)}
        onRetry={() => currentUserQuery.refetch()}
      />
    );
  }

  const user = currentUserQuery.data;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

      <section className={`${adminStyles.card} ${styles.summary}`}>
        <div className={styles.avatar}>
          {user.avatar_url ? (
            // Файл лежит на сервере API, поэтому обычный img без оптимизации next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getMediaUrl(user.avatar_url)} alt={t("avatar")} />
          ) : (
            <span aria-hidden="true">{user.full_name.charAt(0)}</span>
          )}
        </div>

        <div className={styles.identity}>
          <h2>{user.full_name}</h2>
          <p>{tRole(user.role)}</p>
          {user.school && <p>{user.school.name}</p>}

          <label className={adminStyles.fileLabel}>
            {uploadAvatar.isPending ? (
              <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
            ) : (
              <ImageUp size={16} aria-hidden="true" />
            )}
            {t("uploadAvatar")}
            <input
              type="file"
              accept="image/*"
              disabled={uploadAvatar.isPending}
              onChange={handleAvatarChange}
            />
          </label>

          {uploadAvatar.isError && (
            <p className={adminStyles.formError} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              {handleApiError(uploadAvatar.error, tApiErrors)}
            </p>
          )}
        </div>
      </section>

      <div className={styles.columns}>
        <ProfileForm key={user.id} user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}
