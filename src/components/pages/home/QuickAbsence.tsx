"use client";

import { Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AbsenceRequest } from "@/apis/absence.api";
import { useCreateAbsenceRequest } from "@/hooks/useAbsenceRequests";
import { showToast, showUndoToast } from "@/hooks/useToast";
import { handleApiError } from "@/lib/errorHandler";
import scss from "./home.module.scss";

type QuickAbsenceProps = {
  studentId: number;
  childName: string;
  today: string;
  requests: AbsenceRequest[];
};

// Родитель в одно касание сообщает, что ребёнок сегодня болеет. Заявка уходит
// через 5 секунд — до этого её можно отменить в уведомлении.
export function QuickAbsence({ studentId, childName, today, requests }: QuickAbsenceProps) {
  const t = useTranslations("dashboard.quickAbsence");
  const tToast = useTranslations("toast");
  const tApiErrors = useTranslations("apiErrors");
  const createRequest = useCreateAbsenceRequest();
  const [isQueued, setIsQueued] = useState(false);

  const alreadyRequested = requests.some(
    (request) => request.student_id === studentId && request.target_date === today,
  );
  if (alreadyRequested) {
    return null;
  }

  const handleClick = () => {
    setIsQueued(true);
    showUndoToast({
      message: t("queued", { name: childName }),
      undoLabel: tToast("undo"),
      onUndo: () => setIsQueued(false),
      onCommit: () => {
        createRequest.mutate(
          { student_id: studentId, target_date: today, reason: t("reason"), comment: null },
          {
            onSuccess: () => showToast({ message: t("sent"), tone: "default" }),
            onError: (error) => showToast({ message: handleApiError(error, tApiErrors), tone: "error" }),
            onSettled: () => setIsQueued(false),
          },
        );
      },
    });
  };

  return (
    <button type="button" className={scss.quickAbsence} disabled={isQueued} onClick={handleClick}>
      <Thermometer size={18} aria-hidden="true" />
      {t("button", { name: childName })}
    </button>
  );
}
