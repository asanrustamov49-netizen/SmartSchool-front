import { useSyncExternalStore } from "react";
import {
  DEFAULT_ACCENT,
  getAccent,
  getFlag,
  getSidebarCollapsed,
  subscribeAppearance,
  type Accent,
  type Flag,
} from "@/lib/appearance";

// На сервере настроек браузера нет — отдаются значения по умолчанию.
export function useAccent(): Accent {
  return useSyncExternalStore(subscribeAppearance, getAccent, () => DEFAULT_ACCENT);
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribeAppearance, getSidebarCollapsed, () => false);
}

export function useFlag(flag: Flag): boolean {
  return useSyncExternalStore(subscribeAppearance, () => getFlag(flag), () => false);
}
