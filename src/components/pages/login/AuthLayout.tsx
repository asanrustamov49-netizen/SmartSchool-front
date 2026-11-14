"use client";

import { ArrowLeft, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./login.module.scss";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  // Ссылка на Landing нужна только гостю на странице входа.
  showBackLink?: boolean;
  children: React.ReactNode;
};

const localeLabels: Record<string, string> = {
  ky: "KG",
  ru: "RU",
};

export function AuthLayout({ title, subtitle, showBackLink = false, children }: AuthLayoutProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={styles.page}>
      {showBackLink && (
        <Link href="/welcome" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t("backToHome")}
        </Link>
      )}
      <div className={styles.langSwitcher}>
        {routing.locales.map((item) => (
          <button
            key={item}
            type="button"
            className={item === locale ? styles.langButtonActive : styles.langButton}
            aria-pressed={item === locale}
            onClick={() => router.replace(pathname, { locale: item })}
          >
            {localeLabels[item]}
          </button>
        ))}
      </div>

      <main className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <GraduationCap size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <strong>Smart School</strong>
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {children}
      </main>
    </div>
  );
}
