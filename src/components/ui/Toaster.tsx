"use client";

import { CircleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { dismissToast, useToasts } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import scss from "./toaster.module.scss";

export function Toaster() {
  const t = useTranslations("toast");
  const toasts = useToasts();

  return (
    <div className={scss.region} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn(scss.toast, toast.tone === "error" && scss.error)}>
          {toast.tone === "error" && <CircleAlert size={18} aria-hidden="true" />}
          <span className={scss.message}>{toast.message}</span>
          {toast.actionLabel && (
            <button type="button" className={scss.action} onClick={toast.onAction}>
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            className={scss.close}
            aria-label={t("close")}
            onClick={() => dismissToast(toast.id)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
