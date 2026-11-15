"use client";

import { CalendarDays, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AbsenceRequest } from "@/apis/absence.api";
import { useCancelAbsenceRequest, useReviewAbsenceRequest } from "@/hooks/useAbsenceRequests";
import { useDateFormat } from "@/hooks/useDateFormat";
import { handleApiError } from "@/lib/errorHandler";
import { cn, emptyToNull } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./absence.module.scss";

type AbsenceRequestCardProps = {
  request: AbsenceRequest;
  canReview: boolean;
  canCancel: boolean;
};

export function AbsenceRequestCard({ request, canReview, canCancel }: AbsenceRequestCardProps) {
  const t = useTranslations("absence");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDate, formatDateTime } = useDateFormat();
  const reviewMutation = useReviewAbsenceRequest();
  const cancelMutation = useCancelAbsenceRequest();
  const [reviewComment, setReviewComment] = useState("");
  const isPending = request.status === "PENDING";
  const isBusy = reviewMutation.isPending || cancelMutation.isPending;
  const error = reviewMutation.error ?? cancelMutation.error;

  const review = (decision: "approve" | "reject") => {
    reviewMutation.mutate({ requestId: request.id, decision, comment: emptyToNull(reviewComment) });
  };

  return (
    <li className={styles.item}>
      <div className={styles.itemHeader}>
        <div>
          <strong>{request.student_name ?? "—"}</strong>
          <span className={adminStyles.cellMuted}>
            {request.class_name} · {t("parent", { name: request.parent_name ?? "—" })}
          </span>
        </div>
        <span className={cn(styles.status, styles[`status${request.status}`])}>
          {t(`status.${request.status}`)}
        </span>
      </div>

      <p className={styles.date}>
        <CalendarDays size={14} aria-hidden="true" />
        {formatDate(request.target_date)}
      </p>
      <p className={styles.reason}>{request.reason}</p>
      {request.comment && <p className={styles.comment}>{request.comment}</p>}
      {request.review_comment && (
        <p className={styles.comment}>{t("reviewComment", { comment: request.review_comment })}</p>
      )}
      <p className={styles.meta}>{t("sentAt", { date: formatDateTime(request.request_time) })}</p>

      {error && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(error, tApiErrors)}
        </p>
      )}

      {isPending && canReview && (
        <div className={styles.actions}>
          <input
            className={adminStyles.input}
            placeholder={t("reviewCommentPlaceholder")}
            aria-label={t("reviewCommentPlaceholder")}
            maxLength={500}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
          />
          <button
            type="button"
            className={adminStyles.secondaryButton}
            disabled={isBusy}
            onClick={() => review("reject")}
          >
            {t("reject")}
          </button>
          <button
            type="button"
            className={adminStyles.primaryButton}
            disabled={isBusy}
            onClick={() => review("approve")}
          >
            {t("approve")}
          </button>
        </div>
      )}

      {isPending && canCancel && (
        <div className={styles.actions}>
          <button
            type="button"
            className={adminStyles.dangerLink}
            disabled={isBusy}
            onClick={() => cancelMutation.mutate(request.id)}
          >
            {t("cancel")}
          </button>
        </div>
      )}
    </li>
  );
}
