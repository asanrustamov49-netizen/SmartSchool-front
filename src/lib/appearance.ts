// Личные настройки внешнего вида: акцентный цвет и компактное меню.
// Backend их не хранит, поэтому они сохраняются в браузере пользователя.
// Значения выставляются атрибутами на <html>: стили читают их без React,
// а скрипт в app/layout.tsx применяет их ещё до первой отрисовки.

import { TOKEN_COOKIE_NAME } from "@/lib/auth";

export const ACCENTS = [
  "blue",
  "indigo",
  "violet",
  "rose",
  "red",
  "orange",
  "amber",
  "green",
  "emerald",
  "teal",
  "sky",
  "graphite",
] as const;
export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "blue";

// Ключ темы next-themes (светлая/тёмная), используется в Providers.
export const THEME_STORAGE_KEY = "smart-school-theme";
const ACCENT_KEY = "smart-school-accent";
const SIDEBAR_KEY = "smart-school-sidebar";

// Переключатели вида: ключ в браузере и атрибут <html data-…="on">.
// autoLogout — выход после 15 минут без действий
// (общий компьютер в учительской); reduceMotion — без анимаций;
// readableText — шире интервалы между буквами и строками; underlineLinks — ссылки подчёркнуты;
// scheduledTheme — тёмная тема вечером и ночью, светлая днём (components/layout/ThemeSchedule).
export const FLAGS = [
  "autoLogout",
  "scheduledTheme",
  "reduceMotion",
  "readableText",
  "underlineLinks",
] as const;
export type Flag = (typeof FLAGS)[number];
const flagKey = (flag: Flag) => `smart-school-${flag}`;

// Настройки с выбором из нескольких вариантов: атрибут <html data-style="gov">.
// Первый вариант — по умолчанию, для него атрибут не ставится.
// style: основной, государственный (строгий официальный вид, как на гос. платформах),
// минимализм, мягкий, высокий контраст. textSize: мелкий, обычный, крупный.
// density: просторно или компактно (больше строк в таблицах). font: фирменный или чёткий системный.
// dateFormat: «24 нояб. 2026 г.» или «24.11.2026» (hooks/useDateFormat).
export const CHOICES = {
  style: ["default", "gov", "minimal", "soft", "contrast"],
  textSize: ["normal", "small", "large"],
  density: ["comfortable", "compact"],
  font: ["default", "clear"],
  dateFormat: ["text", "numeric"],
} as const;
export type ChoiceName = keyof typeof CHOICES;
export type ChoiceValue<TName extends ChoiceName> = (typeof CHOICES)[TName][number];
const CHOICE_NAMES = Object.keys(CHOICES) as ChoiceName[];
const choiceKey = (name: ChoiceName) => `smart-school-${name}`;
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

export function getFlag(flag: Flag) {
  return document.documentElement.dataset[flag] === "on";
}

export function setFlag(flag: Flag, on: boolean) {
  if (on) {
    document.documentElement.dataset[flag] = "on";
  } else {
    delete document.documentElement.dataset[flag];
  }
  writeStorage(flagKey(flag), on ? "on" : "off");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getChoice<TName extends ChoiceName>(name: TName): ChoiceValue<TName> {
  const options: readonly string[] = CHOICES[name];
  const value = document.documentElement.dataset[name];
  const match = options.find((option) => option === value) ?? options[0];
  return match as ChoiceValue<TName>;
}

export function setChoice<TName extends ChoiceName>(name: TName, value: ChoiceValue<TName>) {
  if (value === CHOICES[name][0]) {
    delete document.documentElement.dataset[name];
  } else {
    document.documentElement.dataset[name] = value;
  }
  writeStorage(choiceKey(name), value);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// При выходе из аккаунта настройки сбрасываются к значениям по умолчанию:
// следующий пользователь этого браузера и гостевые страницы видят синюю светлую тему.
// Язык не сбрасывается — он задаётся адресом страницы.
export function resetAppearance() {
  try {
    window.localStorage.removeItem(ACCENT_KEY);
    window.localStorage.removeItem(SIDEBAR_KEY);
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    for (const flag of FLAGS) {
      window.localStorage.removeItem(flagKey(flag));
    }
    for (const name of CHOICE_NAMES) {
      window.localStorage.removeItem(choiceKey(name));
    }
  } catch {
    // Хранилище недоступно: сбрасывать нечего.
  }

  delete document.documentElement.dataset.accent;
  delete document.documentElement.dataset.sidebar;
  for (const flag of FLAGS) {
    delete document.documentElement.dataset[flag];
  }
  for (const name of CHOICE_NAMES) {
    delete document.documentElement.dataset[name];
  }
}

// Кабинет применяет сохранённые настройки сам: после входа переход идёт без
// перезагрузки, и скрипт из app/layout.tsx на гостевой странице их не ставил.
export function applySavedAppearance() {
  try {
    const accent = window.localStorage.getItem(ACCENT_KEY);
    const sidebar = window.localStorage.getItem(SIDEBAR_KEY);
    if (isAccent(accent)) {
      document.documentElement.dataset.accent = accent;
    }
    if (sidebar) {
      document.documentElement.dataset.sidebar = sidebar;
    }
    for (const flag of FLAGS) {
      if (window.localStorage.getItem(flagKey(flag)) === "on") {
        document.documentElement.dataset[flag] = "on";
      }
    }
    for (const name of CHOICE_NAMES) {
      const value = window.localStorage.getItem(choiceKey(name));
      const options: readonly string[] = CHOICES[name];
      if (value && value !== options[0] && options.includes(value)) {
        document.documentElement.dataset[name] = value;
      }
    }
  } catch {
    // Хранилище недоступно: остаются значения по умолчанию.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeAppearance(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

// Используется до гидратации, поэтому написан строкой без зависимостей.
// Личные настройки применяются только вошедшему пользователю (есть cookie с токеном):
// лендинг и страница входа всегда в оформлении по умолчанию.
export const APPEARANCE_INIT_SCRIPT = `try{if(document.cookie.indexOf("${TOKEN_COOKIE_NAME}=")>-1){var d=document.documentElement;var a=localStorage.getItem("${ACCENT_KEY}");if(a)d.dataset.accent=a;var s=localStorage.getItem("${SIDEBAR_KEY}");if(s)d.dataset.sidebar=s;${FLAGS.map((flag) => `if(localStorage.getItem("${flagKey(flag)}")==="on")d.dataset.${flag}="on";`).join("")}${CHOICE_NAMES.map((name) => `var c_${name}=localStorage.getItem("${choiceKey(name)}");if(c_${name}&&c_${name}!=="${CHOICES[name][0]}")d.dataset.${name}=c_${name};`).join("")}}}catch(e){}`;

// Карточка «С чего начать» на главной: скрыта ли она этим пользователем.
const tipsKey = (userId: number) => `smart-school-tips-${userId}`;

export function getTipsDismissed(userId: number): boolean {
  try {
    return window.localStorage.getItem(tipsKey(userId)) === "hidden";
  } catch {
    return false;
  }
}

export function dismissTips(userId: number) {
  writeStorage(tipsKey(userId), "hidden");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
