// Личные настройки внешнего вида: акцентный цвет и компактное меню.
// Backend их не хранит, поэтому они сохраняются в браузере пользователя.
// Значения выставляются атрибутами на <html>: стили читают их без React,
// а скрипт в app/layout.tsx применяет их ещё до первой отрисовки.

export const ACCENTS = ["blue", "violet", "emerald", "amber", "rose", "graphite"] as const;
export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "blue";

const ACCENT_KEY = "smart-school-accent";
const SIDEBAR_KEY = "smart-school-sidebar";
const CHANGE_EVENT = "smart-school-appearance";

function isAccent(value: string | null): value is Accent {
  return ACCENTS.some((accent) => accent === value);
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Хранилище недоступно (приватный режим): настройка действует до перезагрузки.
  }
}

export function getAccent(): Accent {
  const value = document.documentElement.dataset.accent ?? null;
  return isAccent(value) ? value : DEFAULT_ACCENT;
}

export function setAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
  writeStorage(ACCENT_KEY, accent);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getSidebarCollapsed() {
  return document.documentElement.dataset.sidebar === "collapsed";
}

export function setSidebarCollapsed(collapsed: boolean) {
  document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  writeStorage(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeAppearance(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

// Используется до гидратации, поэтому написан строкой без зависимостей.
export const APPEARANCE_INIT_SCRIPT = `try{var d=document.documentElement;var a=localStorage.getItem("${ACCENT_KEY}");if(a)d.dataset.accent=a;var s=localStorage.getItem("${SIDEBAR_KEY}");if(s)d.dataset.sidebar=s;}catch(e){}`;
