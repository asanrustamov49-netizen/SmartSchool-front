"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { handleApiError } from "@/lib/errorHandler";
import { showToast, showUndoToast } from "./useToast";

// Удаление без окна подтверждения: запись сразу скрывается из списка, а запрос
// на удаление уходит через 5 секунд, если пользователь не нажал «Отменить».
export function useUndoableDelete(deleteById: (id: number) => Promise<unknown>, deletedMessage: string) {
  const t = useTranslations("toast");
  const tApiErrors = useTranslations("apiErrors");
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  const showAgain = (id: number) => {
    setHiddenIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const requestDelete = (id: number) => {
    setHiddenIds((current) => new Set(current).add(id));
    showUndoToast({
      message: deletedMessage,
      undoLabel: t("undo"),
      onUndo: () => showAgain(id),
      onCommit: () => {
        deleteById(id).catch((error: unknown) => {
          showAgain(id);
          showToast({ message: handleApiError(error, tApiErrors), tone: "error" });
        });
      },
    });
  };

  return { hiddenIds, requestDelete };
}
