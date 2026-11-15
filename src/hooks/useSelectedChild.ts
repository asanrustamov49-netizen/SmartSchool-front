import { useSyncExternalStore } from "react";
import type { ParentChild } from "@/apis/auth.api";

// Выбранный родителем ребёнок общий для всех страниц (главная, дневник, расписание, задания)
// и запоминается в браузере. При выходе ключ удаляется (см. resetSelectedChild).
const SELECTED_CHILD_KEY = "smart-school-selected-child";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStoredChildId(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_CHILD_KEY);
  } catch {
    return null;
  }
}

function readServerChildId(): string | null {
  return null;
}

export function resetSelectedChild() {
  try {
    window.localStorage.removeItem(SELECTED_CHILD_KEY);
  } catch {
    // Хранилище браузера недоступно — сбрасывать нечего.
  }
}

// Если сохранённого ребёнка нет среди детей (другой аккаунт, ребёнок отвязан) — выбран первый.
export function useSelectedChild(children: ParentChild[]) {
  const storedChildId = useSyncExternalStore(subscribe, readStoredChildId, readServerChildId);
  const storedChild = children.find((child) => String(child.id) === storedChildId);
  const selectedChildId = storedChild?.id ?? children[0]?.id ?? null;

  const selectChild = (childId: number) => {
    try {
      window.localStorage.setItem(SELECTED_CHILD_KEY, String(childId));
    } catch {
      // Без хранилища выбор просто не запомнится.
    }
    for (const listener of listeners) {
      listener();
    }
  };

  return { selectedChildId, selectChild };
}
