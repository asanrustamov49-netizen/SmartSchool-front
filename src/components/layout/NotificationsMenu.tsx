"use client";

import { Bell } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { Notification } from "@/apis/notifications.api";
import { DataState } from "@/components/ui/DataState";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "@/hooks/useNotifications";
import { handleApiError } from "@/lib/errorHandler";
import styles from "./app-shell.module.scss";

const NOTIFICATIONS_LIMIT = 20;

// Ссылки из notification.link ведут на разделы, которых во frontend ещё нет,
// поэтому уведомление пока только отмечается прочитанным.
export function NotificationsMenu() {
  const t = useTranslations("app");
  const tApiErrors = useTranslations("apiErrors");
  const format = useFormatter();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCountQuery = useUnreadNotificationsCount();
  const notificationsQuery = useNotifications(NOTIFICATIONS_LIMIT, isOpen);
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const unreadCount = unreadCountQuery.data?.unread ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
  };

  const renderList = () => {
    if (notificationsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (notificationsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(notificationsQuery.error, tApiErrors)}
          onRetry={() => notificationsQuery.refetch()}
        />
      );
    }

    if (notificationsQuery.data.length === 0) {
      return <DataState status="empty" message={t("notificationsEmpty")} />;
    }

    return (
      <div className={styles.notificationList}>
        {notificationsQuery.data.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={styles.notificationItem}
            onClick={() => handleNotificationClick(notification)}
          >
            <span
              className={`${styles.notificationDot} ${notification.is_read ? "" : styles.notificationDotUnread}`}
              aria-hidden="true"
            />
            <span>
              <span className={styles.notificationText}>{notification.title}</span>
              {notification.body && (
                <span className={`${styles.notificationText} ${styles.notificationBody}`}>
                  {notification.body}
                </span>
              )}
              <small>
                {format.dateTime(new Date(notification.created_at), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </small>
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.dropdownWrap}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={t("notifications")}
        aria-expanded={isOpen}
        aria-controls="notifications-panel"
        onClick={() => {
          // Счётчик не обновляется в фоне, поэтому перечитывается при открытии списка.
          if (!isOpen) {
            unreadCountQuery.refetch();
          }
          setIsOpen(!isOpen);
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdownPanel} id="notifications-panel">
          <div className={styles.dropdownHeader}>
            <strong>{t("notifications")}</strong>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllButton}
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                {t("markAllRead")}
              </button>
            )}
          </div>
          {renderList()}
        </div>
      )}
    </div>
  );
}
