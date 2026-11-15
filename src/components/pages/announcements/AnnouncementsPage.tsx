"use client";

import { CalendarDays, CircleAlert, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Announcement } from "@/apis/announcements.api";
import { DataState } from "@/components/ui/DataState";
import { useAnnouncementsList, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDateFormat } from "@/hooks/useDateFormat";
import { handleApiError } from "@/lib/errorHandler";
import { getMediaUrl } from "@/lib/utils";
import { AnnouncementForm } from "./AnnouncementForm";
import adminStyles from "../admin/admin.module.scss";
import styles from "./announcements.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form"; announcement: Announcement | null }
  | { type: "delete"; announcement: Announcement };

export function AnnouncementsPage() {
  const t = useTranslations("announcements");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDate } = useDateFormat();
  const currentUserQuery = useCurrentUser();
  const announcementsQuery = useAnnouncementsList();
  const deleteMutation = useDeleteAnnouncement();
  const [panel, setPanel] = useState<Panel>({ type: "none" });

  // Создавать, менять и удалять объявления backend разрешает только директору и завучу.
  const role = currentUserQuery.data?.role;
  const canManage = role === "DIRECTOR" || role === "DEPUTY";
  const announcements = announcementsQuery.data?.pages.flat() ?? [];

  const openPanel = (nextPanel: Panel) => {
    deleteMutation.reset();
    setPanel(nextPanel);
  };

  const handleDelete = (announcement: Announcement) => {
    deleteMutation.mutate(announcement.id, { onSuccess: () => setPanel({ type: "none" }) });
  };

  const renderDeleteConfirm = (announcement: Announcement) => (
    <div className={styles.confirm} role="alertdialog" aria-label={t("delete")}>
      <p>{t("confirmDelete")}</p>
      {deleteMutation.isError && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(deleteMutation.error, tApiErrors)}
        </p>
      )}
      <div className={adminStyles.formActions}>
        <button
          type="button"
          className={adminStyles.secondaryButton}
          onClick={() => openPanel({ type: "none" })}
        >
          {tForm("cancel")}
        </button>
        <button
          type="button"
          className={`${adminStyles.primaryButton} ${adminStyles.dangerButton}`}
          disabled={deleteMutation.isPending}
          onClick={() => handleDelete(announcement)}
        >
          {t("delete")}
        </button>
      </div>
    </div>
  );

  const renderList = () => {
    if (announcementsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (announcementsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(announcementsQuery.error, tApiErrors)}
          onRetry={() => announcementsQuery.refetch()}
        />
      );
    }

    if (announcements.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    return (
      <ul className={styles.list}>
        {announcements.map((announcement) => (
          <li key={announcement.id} className={styles.item}>
            {announcement.image_url && (
              // Файл лежит на сервере API, поэтому обычный img без оптимизации next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.image}
                src={getMediaUrl(announcement.image_url)}
                alt=""
                loading="lazy"
              />
            )}
            <div className={styles.content}>
              <span className={styles.date}>
                <CalendarDays size={14} aria-hidden="true" />
                {formatDate(announcement.event_date ?? announcement.created_at)}
              </span>
              <h2>{announcement.title}</h2>
              {announcement.body && <p>{announcement.body}</p>}

              {canManage && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={adminStyles.linkButton}
                    onClick={() => openPanel({ type: "form", announcement })}
                  >
                    {tForm("edit")}
                  </button>
                  <button
                    type="button"
                    className={adminStyles.dangerLink}
                    onClick={() => openPanel({ type: "delete", announcement })}
                  >
                    {t("delete")}
                  </button>
                </div>
              )}

              {panel.type === "delete" &&
                panel.announcement.id === announcement.id &&
                renderDeleteConfirm(announcement)}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            className={adminStyles.primaryButton}
            onClick={() => openPanel({ type: "form", announcement: null })}
          >
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        )}
      </header>

      {panel.type === "form" && (
        <AnnouncementForm
          key={panel.announcement?.id ?? "new"}
          announcement={panel.announcement}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      <section className={adminStyles.card}>
        {renderList()}
        {announcementsQuery.hasNextPage && (
          <div className={styles.more}>
            <button
              type="button"
              className={adminStyles.secondaryButton}
              disabled={announcementsQuery.isFetchingNextPage}
              onClick={() => announcementsQuery.fetchNextPage()}
            >
              {announcementsQuery.isFetchingNextPage ? t("loading") : t("loadMore")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
