import { useSyncExternalStore } from "react";
import {
  DEFAULT_ACCENT,
  getAccent,
  getSidebarCollapsed,
  subscribeAppearance,
  type Accent,
} from "@/lib/appearance";

// На сервере настроек браузера нет — отдаются значения по умолчанию.
export function useAccent(): Accent {
  return useSyncExternalStore(subscribeAppearance, getAccent, () => DEFAULT_ACCENT);
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribeAppearance, getSidebarCollapsed, () => false);
}
