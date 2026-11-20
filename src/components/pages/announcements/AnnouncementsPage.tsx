"use client";

import { CalendarDays, Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Announcement } from "@/apis/announcements.api";
import { DataState } from "@/components/ui/DataState";
import { useCreateIntent } from "@/hooks/useCreateIntent";
import { useAnnouncementsList, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { handleApiError } from "@/lib/errorHandler";
import { getMediaUrl } from "@/lib/utils";
import { AnnouncementForm } from "./AnnouncementForm";
import adminStyles from "../admin/admin.module.scss";
import styles from "./announcements.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form"; announcement: Announcement | null };

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
  const { hiddenIds, requestDelete } = useUndoableDelete(deleteMutation.mutateAsync, t("deleted"));
  const announcements = (announcementsQuery.data?.pages.flat() ?? []).filter(
    (announcement) => !hiddenIds.has(announcement.id),
  );

  const openPanel = (nextPanel: Panel) => {
    setPanel(nextPanel);
  };
  useCreateIntent("announcement", () => openPanel({ type: "form", announcement: null }), canManage);

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
      return (
        <DataState
          status="empty"
          message={t("empty")}
          action={canManage ? { label: t("add"), onClick: () => openPanel({ type: "form", announcement: null }) } : undefined}
        />
      );
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
              {canManage && (
                <span className={styles.audienceTag}>
                  <Users size={13} aria-hidden="true" />
                  {announcement.audience
                    ? announcement.audience.map((group) => t(`audienceGroups.${group}`)).join(", ")
                    : t("audienceAll")}
                </span>
              )}
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
                    onClick={() => requestDelete(announcement.id)}
                  >
                    {t("delete")}
                  </button>
                </div>
              )}

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
