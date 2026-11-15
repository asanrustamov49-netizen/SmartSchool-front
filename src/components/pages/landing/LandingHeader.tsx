"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Logo } from "@/components/ui/Logo";
import styles from "./landing.module.scss";

const SECTION_LINKS = [
  { key: "features", href: "#features" },
  { key: "audience", href: "#audience" },
  { key: "how", href: "#how" },
  { key: "access", href: "#access" },
];

const LOCALE_LABELS: Record<string, string> = {
  ky: "KG",
  ru: "RU",
};

export function LandingHeader() {
  const t = useTranslations("landing.nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Корневой layout отдаёт lang="ky"; на клиенте язык документа приводится к выбранному.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a href="#top" className={styles.brand} onClick={closeMenu}>
          <Logo size="sm" theme="dark" className={styles.brandFull} />
          <Logo variant="icon" size="sm" className={styles.brandCompact} />
        </a>

        <nav
          id="landing-navigation"
          className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
          aria-label={t("label")}
        >
          <ul className={styles.navLinks}>
            {SECTION_LINKS.map((link) => (
              <li key={link.key}>
                <a href={link.href} onClick={closeMenu}>
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
          <div className={styles.navMobileActions}>
            <Link href="/login" className={styles.buttonGhost} onClick={closeMenu}>
              {t("login")}
            </Link>
            <a href="#access" className={styles.buttonPrimary} onClick={closeMenu}>
              {t("start")}
            </a>
          </div>
        </nav>

        <div className={styles.headerActions}>
          <div className={styles.localeSwitch} role="group" aria-label={t("language")}>
            {routing.locales.map((item) => (
              <button
                key={item}
                type="button"
                className={item === locale ? styles.localeActive : undefined}
                aria-pressed={item === locale}
                onClick={() => router.replace(pathname, { locale: item })}
              >
                {LOCALE_LABELS[item]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.iconButton}
            aria-label={t("toggleTheme")}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Moon size={17} className={styles.themeIconLight} aria-hidden="true" />
            <Sun size={17} className={styles.themeIconDark} aria-hidden="true" />
          </button>

          <Link href="/login" className={`${styles.buttonGhost} ${styles.desktopOnly}`}>
            {t("login")}
          </Link>
          <a href="#access" className={`${styles.buttonPrimary} ${styles.desktopOnly}`}>
            {t("start")}
          </a>

          <button
            type="button"
            className={`${styles.iconButton} ${styles.menuButton}`}
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={isMenuOpen}
            aria-controls="landing-navigation"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
