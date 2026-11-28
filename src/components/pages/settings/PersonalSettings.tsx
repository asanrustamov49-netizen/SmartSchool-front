"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { getAllowedItems, getMobileItems, getRoleNavigation } from "@/components/layout/navigation";
import { Select } from "@/components/ui/Select";
import { usePreferences } from "@/hooks/usePreferences";
import {
  HOME_BLOCKS,
  MOBILE_TABS_COUNT,
  NOTIFICATION_CATEGORIES,
  type HomeBlock,
  type NotificationCategory,
} from "@/lib/preferences";
import adminStyles from "../admin/admin.module.scss";
import styles from "./settings.module.scss";

type ToggleRowProps = {
  title: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ title, hint, checked, disabled = false, onChange }: ToggleRowProps) {
  return (
    <label className={styles.flag} data-disabled={disabled || undefined}>
      <span>
        <strong>{title}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

// Расписание на главной есть только у учителя, ученика и родителя.
const LESSON_ROLES = ["TEACHER", "CLASS_TEACHER", "STUDENT", "PARENT"];

function toggleInList<TItem>(list: TItem[], item: TItem, include: boolean): TItem[] {
  const without = list.filter((current) => current !== item);
  return include ? [...without, item] : without;
}

// Настройки, которые зависят от роли: главная, нижняя панель, стартовая страница, уведомления.
// Сохраняются для этого аккаунта (lib/preferences.ts).
export function PersonalSettings({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("settings.personal");
  const tNav = useTranslations("app.nav");
  const { preferences, update } = usePreferences();

  const navigation = getRoleNavigation(currentUser);
  const sections = navigation.items.filter((item) => item.available);
  const tabKeys = getMobileItems(navigation, preferences.mobileTabs).map((item) => item.key);
  const homeBlocks = HOME_BLOCKS.filter((block) => block !== "lessons" || LESSON_ROLES.includes(currentUser.role));

  const setBlockShown = (block: HomeBlock, shown: boolean) => {
    update({ hiddenHomeBlocks: toggleInList(preferences.hiddenHomeBlocks, block, !shown) });
  };

  const setTab = (key: string, included: boolean) => {
    // Порядок вкладок — как в боковом меню, независимо от порядка нажатий.
    const nextKeys = toggleInList(tabKeys, key, included);
    const ordered = sections.map((item) => item.key).filter((sectionKey) => nextKeys.includes(sectionKey));
    update({ mobileTabs: ordered });
  };

  const setNotificationShown = (category: NotificationCategory, shown: boolean) => {
    update({ hiddenNotifications: toggleInList(preferences.hiddenNotifications, category, !shown) });
  };

  return (
    <>
      <section id="home" className={adminStyles.card}>
        <h2 className={adminStyles.cardTitle}>{t("homeTitle")}</h2>
        <p className={styles.hint}>{t("homeHint")}</p>
        <div className={styles.flags}>
          {homeBlocks.map((block) => (
            <ToggleRow
              key={block}
              title={t(`homeBlocks.${block}`)}
              checked={!preferences.hiddenHomeBlocks.includes(block)}
              onChange={(shown) => setBlockShown(block, shown)}
            />
          ))}
        </div>
      </section>

      <div className={styles.columns}>
        <section className={adminStyles.card}>
          <h2 className={adminStyles.cardTitle}>{t("startTitle")}</h2>
          <p className={styles.hint}>{t("startHint")}</p>
          <Select
            ariaLabel={t("startTitle")}
            value={preferences.startPage}
            onValueChange={(href) => update({ startPage: href })}
            options={getAllowedItems(navigation).map((item) => ({ value: item.href, label: tNav(item.key) }))}
          />
        </section>

        <section className={adminStyles.card}>
          <h2 className={adminStyles.cardTitle}>{t("notificationsTitle")}</h2>
          <p className={styles.hint}>{t("notificationsHint")}</p>
          <div className={styles.flags}>
            {NOTIFICATION_CATEGORIES.map((category) => (
              <ToggleRow
                key={category}
                title={t(`notifications.${category}`)}
                checked={!preferences.hiddenNotifications.includes(category)}
                onChange={(shown) => setNotificationShown(category, shown)}
              />
            ))}
          </div>
        </section>
      </div>

      <section className={adminStyles.card}>
        <div className={styles.cardHead}>
          <h2 className={adminStyles.cardTitle}>{t("tabsTitle")}</h2>
          {preferences.mobileTabs !== null && (
            <button type="button" className={adminStyles.linkButton} onClick={() => update({ mobileTabs: null })}>
              <RotateCcw size={15} aria-hidden="true" />
              {t("tabsReset")}
            </button>
          )}
        </div>
        <p className={styles.hint}>
          {t("tabsHint", { count: MOBILE_TABS_COUNT, chosen: tabKeys.length })}
        </p>
        <div className={styles.flags}>
          {sections.map((item) => {
            const isChosen = tabKeys.includes(item.key);
            return (
              <ToggleRow
                key={item.key}
                title={tNav(item.key)}
                checked={isChosen}
                // Не больше четырёх вкладок и не меньше одной.
                disabled={isChosen ? tabKeys.length === 1 : tabKeys.length >= MOBILE_TABS_COUNT}
                onChange={(included) => setTab(item.key, included)}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
