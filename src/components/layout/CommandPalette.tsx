"use client";

import { CornerDownLeft, Languages, LogOut, Moon, Search, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, type KeyboardEvent } from "react";
import { useLogout } from "@/hooks/useAuth";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "./navigation";
import styles from "./command-palette.module.scss";

type PaletteEntry = {
  id: string;
  label: string;
  group: "pages" | "actions";
  icon: LucideIcon;
  run: () => void;
};

type CommandPaletteProps = {
  pages: NavigationItem[];
  onClose: () => void;
};

// Быстрый переход по страницам роли и частые действия. Поиск идёт по уже доступным
// пунктам меню на клиенте: отдельного endpoint поиска в backend нет.
export function CommandPalette({ pages, onClose }: CommandPaletteProps) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const entries: PaletteEntry[] = [
    ...pages.map((page) => ({
      id: page.href,
      label: t(`nav.${page.key}`),
      group: "pages" as const,
      icon: page.icon,
      run: () => router.push(page.href),
    })),
    {
      id: "theme",
      label: resolvedTheme === "dark" ? t("search.lightTheme") : t("search.darkTheme"),
      group: "actions",
      icon: Moon,
      run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    },
    {
      id: "language",
      label: locale === "ky" ? t("search.toRussian") : t("search.toKyrgyz"),
      group: "actions",
      icon: Languages,
      run: () => router.replace(pathname, { locale: locale === "ky" ? "ru" : "ky" }),
    },
    { id: "logout", label: tCommon("logout"), group: "actions", icon: LogOut, run: logout },
  ];

  const normalizedQuery = query.trim().toLowerCase();
  const visibleEntries = entries.filter((entry) => entry.label.toLowerCase().includes(normalizedQuery));
  const safeIndex = Math.min(activeIndex, Math.max(visibleEntries.length - 1, 0));

  const runEntry = (entry: PaletteEntry) => {
    onClose();
    entry.run();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((safeIndex + 1) % Math.max(visibleEntries.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((safeIndex - 1 + visibleEntries.length) % Math.max(visibleEntries.length, 1));
    } else if (event.key === "Enter" && visibleEntries[safeIndex]) {
      event.preventDefault();
      runEntry(visibleEntries[safeIndex]);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  const renderGroup = (group: PaletteEntry["group"]) => {
    const groupEntries = visibleEntries.filter((entry) => entry.group === group);
    if (groupEntries.length === 0) {
      return null;
    }

    return (
      <div className={styles.group} role="group" aria-label={t(`search.${group}`)}>
        <span className={styles.groupLabel}>{t(`search.${group}`)}</span>
        {groupEntries.map((entry) => {
          const index = visibleEntries.indexOf(entry);
          const Icon = entry.icon;
          const isActive = index === safeIndex;

          return (
            <button
              key={entry.id}
              id={`palette-${entry.id}`}
              type="button"
              role="option"
              aria-selected={isActive}
              className={cn(styles.entry, isActive && styles.entryActive)}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => runEntry(entry)}
            >
              <span className={styles.entryIcon}>
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className={styles.entryLabel}>{entry.label}</span>
              {isActive && <CornerDownLeft size={15} className={styles.entryHint} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  };

  const activeEntry = visibleEntries[safeIndex];

  return (
    <div className={styles.overlay} onPointerDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={t("search.title")}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <label className={styles.inputWrap}>
          <Search size={18} aria-hidden="true" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={activeEntry ? `palette-${activeEntry.id}` : undefined}
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd>Esc</kbd>
        </label>

        <div id="palette-list" className={styles.list} role="listbox">
          {visibleEntries.length === 0 ? (
            <p className={styles.empty}>{t("search.empty")}</p>
          ) : (
            <>
              {renderGroup("pages")}
              {renderGroup("actions")}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {t("search.navigate")}
          </span>
          <span>
            <kbd>Enter</kbd> {t("search.open")}
          </span>
        </div>
      </div>
    </div>
  );
}
