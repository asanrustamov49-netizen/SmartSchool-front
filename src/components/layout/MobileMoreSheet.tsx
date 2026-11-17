"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, ChevronRight, Languages, LogOut, Moon, Sun, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { CurrentUser } from "@/apis/auth.api";
import { useLogout } from "@/hooks/useAuth";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn, getMediaUrl } from "@/lib/utils";
import { groupNavigationItems, type NavigationItem } from "./navigation";
import styles from "./MobileMoreSheet.module.scss";

type MobileMoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: CurrentUser;
  // Разделы, которых нет в нижней панели, и личные страницы (профиль, настройки).
  items: NavigationItem[];
  accountItems: NavigationItem[];
  activeKey: string | undefined;
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Лист «Ещё» на телефоне и планшете — сгруппированный список, как в настройках iOS и Google:
// остальные разделы, аккаунт, язык и тема, выход. Строки крупные, с понятными подписями.
export function MobileMoreSheet({
  open,
  onOpenChange,
  currentUser,
  items,
  accountItems,
  activeKey,
}: MobileMoreSheetProps) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const isDark = resolvedTheme === "dark";
  const close = () => onOpenChange(false);

  const renderRow = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = item.key === activeKey;
    return (
      <li key={item.key}>
        <Link
          href={item.href}
          className={cn(styles.row, isActive && styles.rowActive)}
          aria-current={isActive ? "page" : undefined}
          onClick={close}
        >
          <span className={styles.rowIcon}>
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className={styles.rowLabel}>{t(`nav.${item.key}`)}</span>
          {isActive ? (
            <Check className={styles.rowEnd} size={18} aria-hidden="true" />
          ) : (
            <ChevronRight className={styles.rowEnd} size={18} aria-hidden="true" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.sheet}>
          <span className={styles.handle} aria-hidden="true" />

          <div className={styles.header}>
            <span className={styles.avatar} aria-hidden="true">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API
                <img src={getMediaUrl(currentUser.avatar_url)} alt="" />
              ) : (
                getInitials(currentUser.full_name)
              )}
            </span>
            <span className={styles.identity}>
              <Dialog.Title className={styles.name}>{currentUser.full_name}</Dialog.Title>
              <span className={styles.role}>
                {t(`role.${currentUser.role}`)}
                {currentUser.school ? ` · ${currentUser.school.name}` : ""}
              </span>
            </span>
            <Dialog.Close className={styles.close} aria-label={t("closeMenu")}>
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className={styles.body}>
            {items.length > 0 && (
              <nav className={styles.sections} aria-label={t("moreSections")}>
                {/* Те же группы, что в боковом меню: Обзор, Люди, Учёба, Активность. */}
                {groupNavigationItems(items).map(({ group, items: groupItems }) => (
                  <section key={group}>
                    <h2 className={styles.groupTitle}>{t(`groups.${group}`)}</h2>
                    <ul className={styles.group}>{groupItems.map(renderRow)}</ul>
                  </section>
                ))}
              </nav>
            )}

            <section>
              <h2 className={styles.groupTitle}>{t("moreAccount")}</h2>
              <ul className={styles.group}>{accountItems.map(renderRow)}</ul>
            </section>

            <section>
              <h2 className={styles.groupTitle}>{t("moreSettings")}</h2>
              <ul className={styles.group}>
                <li className={styles.row}>
                  <span className={styles.rowIcon}>
                    <Languages size={19} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className={styles.rowLabel}>{t("language")}</span>
                  <span className={styles.segmented} role="group" aria-label={t("language")}>
                    {(["ky", "ru"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={locale === item}
                        className={cn(styles.segment, locale === item && styles.segmentActive)}
                        onClick={() => router.replace(pathname, { locale: item })}
                      >
                        {item === "ky" ? "KG" : "RU"}
                      </button>
                    ))}
                  </span>
                </li>
                <li>
                  <button type="button" className={styles.row} onClick={() => setTheme(isDark ? "light" : "dark")}>
                    <span className={styles.rowIcon}>
                      {isDark ? (
                        <Sun size={19} strokeWidth={1.8} aria-hidden="true" />
                      ) : (
                        <Moon size={19} strokeWidth={1.8} aria-hidden="true" />
                      )}
                    </span>
                    <span className={styles.rowLabel}>{isDark ? t("themeLight") : t("themeDark")}</span>
                  </button>
                </li>
              </ul>
            </section>

            <ul className={styles.group}>
              <li>
                <button type="button" className={cn(styles.row, styles.rowDanger)} onClick={logout}>
                  <span className={styles.rowIcon}>
                    <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className={styles.rowLabel}>{tCommon("logout")}</span>
                </button>
              </li>
            </ul>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
