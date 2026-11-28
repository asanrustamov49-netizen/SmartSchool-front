import { useSyncExternalStore } from "react";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  subscribePreferences,
  updatePreferences,
  type Preferences,
} from "@/lib/preferences";
import { useCurrentUser } from "./useAuth";

// Предпочтения вошедшего пользователя. До загрузки /me и на сервере — значения по умолчанию.
export function usePreferences() {
  const userId = useCurrentUser().data?.id ?? null;
  const preferences = useSyncExternalStore(
    subscribePreferences,
    () => (userId === null ? DEFAULT_PREFERENCES : getPreferences(userId)),
    () => DEFAULT_PREFERENCES,
  );

  const update = (change: Partial<Preferences>) => {
    if (userId !== null) {
      updatePreferences(userId, change);
    }
  };

  return { preferences, update };
}
