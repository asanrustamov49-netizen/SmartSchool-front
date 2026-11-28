// Личные предпочтения, которые зависят от роли и аккаунта: блоки главной, нижняя панель
// на телефоне, стартовая страница и уведомления. Хранятся отдельно для каждого пользователя
// и не сбрасываются при выходе — в отличие от оформления (lib/appearance.ts).

export const HOME_BLOCKS = ["tasks", "lessons", "rating", "events", "announcements"] as const;
export type HomeBlock = (typeof HOME_BLOCKS)[number];

// Уведомления различаются по ссылке, которую ставит backend (/homeworks/…, /absence-requests/…).
export const NOTIFICATION_CATEGORIES = ["homeworks", "absence", "other"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const MOBILE_TABS_COUNT = 4;

export type Preferences = {
  hiddenHomeBlocks: HomeBlock[];
  // null — четыре первых раздела роли, как по умолчанию.
  mobileTabs: string[] | null;
  startPage: string;
  hiddenNotifications: NotificationCategory[];
};

export const DEFAULT_PREFERENCES: Preferences = {
  hiddenHomeBlocks: [],
  mobileTabs: null,
  startPage: "/",
  hiddenNotifications: [],
};

const CHANGE_EVENT = "smart-school-preferences";
const storageKey = (userId: number) => `smart-school-preferences-${userId}`;

// Кэш по сохранённой строке: useSyncExternalStore требует один и тот же объект,
// пока данные не изменились.
let cachedRaw: string | null = null;
let cachedPreferences: Preferences = DEFAULT_PREFERENCES;

function parse(raw: string | null): Preferences {
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }
  try {
    const saved = JSON.parse(raw) as Partial<Preferences>;
    return {
      hiddenHomeBlocks: (saved.hiddenHomeBlocks ?? []).filter((block) => HOME_BLOCKS.includes(block)),
      mobileTabs: Array.isArray(saved.mobileTabs) ? saved.mobileTabs.slice(0, MOBILE_TABS_COUNT) : null,
      startPage: typeof saved.startPage === "string" && saved.startPage.startsWith("/") ? saved.startPage : "/",
      hiddenNotifications: (saved.hiddenNotifications ?? []).filter((category) =>
        NOTIFICATION_CATEGORIES.includes(category),
      ),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function getPreferences(userId: number): Preferences {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey(userId));
  } catch {
    // Хранилище недоступно: значения по умолчанию.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPreferences = parse(raw);
  }
  return cachedPreferences;
}

export function updatePreferences(userId: number, change: Partial<Preferences>) {
  const next = { ...getPreferences(userId), ...change };
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Без хранилища выбор не сохранится.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribePreferences(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getNotificationCategory(link: string | null): NotificationCategory {
  if (link?.startsWith("/homeworks")) {
    return "homeworks";
  }
  if (link?.startsWith("/absence-requests")) {
    return "absence";
  }
  return "other";
}
