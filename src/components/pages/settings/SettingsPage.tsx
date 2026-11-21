"use client";

import {
  Check,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useAccent, useChoice, useFlag, useSidebarCollapsed } from "@/hooks/useAppearance";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  ACCENTS,
  CHOICES,
  FLAGS,
  setAccent,
  setChoice,
  setFlag,
  setSidebarCollapsed,
  type Flag,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./settings.module.scss";

type Option<TValue extends string> = {
  value: TValue;
  label: string;
  icon?: LucideIcon;
};

type OptionGroupProps<TValue extends string> = {
  label: string;
  options: Option<TValue>[];
  value: TValue | undefined;
  onChange: (value: TValue) => void;
};

function OptionGroup<TValue extends string>({ label, options, value, onChange }: OptionGroupProps<TValue>) {
  return (
    <div className={styles.options} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={cn(styles.option, isSelected && styles.optionSelected)}
            onClick={() => onChange(option.value)}
          >
            {Icon && <Icon size={18} aria-hidden="true" />}
            <span>{option.label}</span>
            {isSelected && <Check size={16} className={styles.optionCheck} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

// Переключатель «вкл/выкл» с названием и пояснением.
function FlagSwitch({ flag }: { flag: Flag }) {
  const t = useTranslations("settings.flags");
  const isOn = useFlag(flag);

  return (
    <label className={styles.flag}>
      <span>
        <strong>{t(`${flag}.title`)}</strong>
        <small>{t(`${flag}.hint`)}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={isOn}
        onChange={(event) => setFlag(flag, event.target.checked)}
      />
    </label>
  );
}

// Личные настройки: сохраняются в этом браузере и действуют для всех страниц кабинета.
export function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  const sidebarCollapsed = useSidebarCollapsed();
  const designStyle = useChoice("style");
  const textSize = useChoice("textSize");

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

      <section className={cn(adminStyles.card, styles.preview)} aria-hidden="true">
        <div className={styles.previewSidebar}>
          <span className={styles.previewLogo} />
          <span className={cn(styles.previewItem, styles.previewItemActive)} />
          <span className={styles.previewItem} />
          <span className={styles.previewItem} />
        </div>
        <div className={styles.previewContent}>
          <span className={styles.previewHero}>
            <strong>{t("previewTitle")}</strong>
            <small>{t("previewText")}</small>
          </span>
          <span className={styles.previewRow}>
            <span className={styles.previewButton}>{t("previewButton")}</span>
            <span className={styles.previewChip}>{t(`accents.${accent}`)}</span>
          </span>
        </div>
      </section>

      <section className={adminStyles.card}>
        <h2 className={adminStyles.cardTitle}>{t("accentTitle")}</h2>
        <p className={styles.hint}>{t("accentHint")}</p>
        <div className={styles.swatches} role="radiogroup" aria-label={t("accentTitle")}>
          {ACCENTS.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={item === accent}
              className={cn(styles.swatch, item === accent && styles.swatchSelected)}
              onClick={() => setAccent(item)}
            >
              <span className={styles.swatchColor} data-swatch={item}>
                {item === accent && <Check size={16} aria-hidden="true" />}
              </span>
              <span>{t(`accents.${item}`)}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.columns}>
        <section className={adminStyles.card}>
          <h2 className={adminStyles.cardTitle}>{t("themeTitle")}</h2>
          <OptionGroup
            label={t("themeTitle")}
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: t("themes.light"), icon: Sun },
              { value: "dark", label: t("themes.dark"), icon: Moon },
              { value: "system", label: t("themes.system"), icon: Monitor },
            ]}
          />
        </section>

        <section className={adminStyles.card}>
          <h2 className={adminStyles.cardTitle}>{t("languageTitle")}</h2>
          <OptionGroup
            label={t("languageTitle")}
            value={locale}
            onChange={(nextLocale) => router.replace(pathname, { locale: nextLocale })}
            options={routing.locales.map((item) => ({ value: item, label: t(`languages.${item}`) }))}
          />
        </section>

        <section className={cn(adminStyles.card, styles.sidebarSection)}>
          <h2 className={adminStyles.cardTitle}>{t("sidebarTitle")}</h2>
          <OptionGroup
            label={t("sidebarTitle")}
            value={sidebarCollapsed ? "collapsed" : "expanded"}
            onChange={(value) => setSidebarCollapsed(value === "collapsed")}
            options={[
              { value: "expanded", label: t("sidebar.expanded"), icon: PanelLeftOpen },
              { value: "collapsed", label: t("sidebar.collapsed"), icon: PanelLeftClose },
            ]}
          />
          <p className={styles.hint}>{t("sidebarHint")}</p>
        </section>
      </div>

      <section className={adminStyles.card}>
        <h2 className={adminStyles.cardTitle}>{t("styleTitle")}</h2>
        <div className={styles.styleCards} role="radiogroup" aria-label={t("styleTitle")}>
          {CHOICES.style.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={designStyle === option}
              className={cn(styles.styleCard, designStyle === option && styles.styleCardSelected)}
              onClick={() => setChoice("style", option)}
            >
              <span className={cn(styles.styleSample, styles[`sample_${option}`])} aria-hidden="true">
                <i />
                <b />
              </span>
              <strong>{t(`styles.${option}.title`)}</strong>
              <small>{t(`styles.${option}.hint`)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={adminStyles.card}>
        <h2 className={adminStyles.cardTitle}>{t("textSizeTitle")}</h2>
        <OptionGroup
          label={t("textSizeTitle")}
          value={textSize}
          onChange={(value) => setChoice("textSize", value)}
          options={CHOICES.textSize.map((option) => ({ value: option, label: t(`textSizes.${option}`) }))}
        />
      </section>

      <section className={adminStyles.card}>
        <h2 className={adminStyles.cardTitle}>{t("flagsTitle")}</h2>
        <div className={styles.flags}>
          {FLAGS.map((flag) => (
            <FlagSwitch key={flag} flag={flag} />
          ))}
        </div>
      </section>

      <p className={styles.storageNote}>{t("storageNote")}</p>
    </div>
  );
}
