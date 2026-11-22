import { useSyncExternalStore } from "react";
import {
  DEFAULT_ACCENT,
  CHOICES,
  getAccent,
  getChoice,
  getFlag,
  getSavedBanner,
  getSidebarCollapsed,
  parseBannerPosition,
  subscribeAppearance,
  type Accent,
  type BannerPosition,
  type ChoiceName,
  type ChoiceValue,
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

export function useChoice<TName extends ChoiceName>(name: TName): ChoiceValue<TName> {
  return useSyncExternalStore(subscribeAppearance, () => getChoice(name), () => CHOICES[name][0]);
}

// Сохранённое положение баннера этого пользователя (на сервере — по центру).
export function useBannerPosition(userId: number, bannerUrl: string): BannerPosition {
  const saved = useSyncExternalStore(subscribeAppearance, () => getSavedBanner(userId), () => null);
  return parseBannerPosition(saved, bannerUrl);
}
