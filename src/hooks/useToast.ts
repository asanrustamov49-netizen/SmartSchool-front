"use client";

import { useSyncExternalStore } from "react";

export type Toast = {
  id: number;
  message: string;
  tone: "default" | "error";
  actionLabel?: string;
  onAction?: () => void;
};

const TOAST_DURATION_MS = 5000;

let toasts: Toast[] = [];
let nextToastId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
// Отложенные действия (удаление), которые ещё можно отменить. При закрытии вкладки выполняются сразу.
const pendingCommits = new Map<number, () => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getToasts() {
  return toasts;
}

function getServerToasts(): Toast[] {
  return [];
}

export function dismissToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function showToast(toast: Omit<Toast, "id">, onTimeout?: () => void) {
  const id = nextToastId++;
  toasts = [...toasts.slice(-2), { ...toast, id }];
  emit();
  timers.set(
    id,
    setTimeout(() => {
      dismissToast(id);
      onTimeout?.();
    }, TOAST_DURATION_MS),
  );
  return id;
}

function flushPendingCommits() {
  for (const commit of pendingCommits.values()) {
    commit();
  }
  pendingCommits.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPendingCommits);
}

// Действие выполняется через 5 секунд, а до этого его можно отменить кнопкой в уведомлении.
export function showUndoToast({
  message,
  undoLabel,
  onCommit,
  onUndo,
}: {
  message: string;
  undoLabel: string;
  onCommit: () => void;
  onUndo: () => void;
}) {
  let id = 0;
  const commit = () => {
    if (pendingCommits.delete(id)) {
      onCommit();
    }
  };

  id = showToast(
    {
      message,
      tone: "default",
      actionLabel: undoLabel,
      onAction: () => {
        pendingCommits.delete(id);
        dismissToast(id);
        onUndo();
      },
    },
    commit,
  );
  pendingCommits.set(id, onCommit);
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getToasts, getServerToasts);
}
