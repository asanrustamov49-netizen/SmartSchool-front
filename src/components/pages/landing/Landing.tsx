import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Crown,
  Globe2,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  Languages,
  MonitorSmartphone,
  NotebookPen,
  School,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/navigation";
import { HeroPreview } from "./HeroPreview";
import { LandingEffects } from "./LandingEffects";
import { LandingHeader } from "./LandingHeader";
import styles from "./landing.module.scss";

type Item = { key: string; icon: LucideIcon };

const FEATURES: Item[] = [
  { key: "journal", icon: NotebookPen },
  { key: "progress", icon: BarChart3 },
  { key: "schedule", icon: CalendarClock },
  { key: "homework", icon: ClipboardList },
  { key: "attendance", icon: CalendarCheck },
  { key: "rating", icon: Trophy },
  { key: "communication", icon: HeartHandshake },
  { key: "notifications", icon: Bell },
  { key: "management", icon: School },
];

const AUDIENCES: Item[] = [
  { key: "admin", icon: Crown },
  { key: "teacher", icon: BookOpen },
  { key: "student", icon: GraduationCap },
  { key: "parent", icon: Users },
];

const STEPS = ["school", "accounts", "firstLogin", "work"];

const BENEFITS: Item[] = [
  { key: "single", icon: Sparkles },
  { key: "roles", icon: ShieldCheck },
  { key: "languages", icon: Languages },
  { key: "devices", icon: MonitorSmartphone },
  { key: "transparency", icon: Globe2 },
];

const Landing = async ({ locale }: { locale: string }) => {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <div className={styles.page} id="top" data-landing>
      <LandingEffects />
      <a href="#main" className={styles.skipLink}>
        {t("nav.skip")}
      </a>
      <LandingHeader />

      <main id="main">
        <section className={styles.hero} data-spotlight="layer">
          <span data-spotlight-glow aria-hidden="true" />
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>{t("hero.title")}</h1>
            <p className={styles.heroText}>{t("hero.description")}</p>
            <div className={styles.heroActions}>
              <a href="#access" className={`${styles.buttonPrimary} ${styles.buttonLarge}`}>
                {t("nav.start")}
              </a>
              <a href="#features" className={`${styles.buttonGhost} ${styles.buttonLarge}`}>
                {t("hero.learnMore")}
              </a>
            </div>
            <ul className={styles.heroRoles}>
              {AUDIENCES.map(({ key, icon: Icon }) => (
                <li key={key}>
                  <Icon size={15} aria-hidden="true" />
                  {t(`audience.roles.${key}.short`)}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview locale={locale} />
        </section>

        <section id="features" className={styles.section} aria-labelledby="features-title">
          <div className={styles.sectionIntro} data-reveal>
            <h2 id="features-title" className={styles.sectionTitle}>
              {t("features.title")}
            </h2>
            <p>{t("features.description")}</p>
          </div>

          <div className={styles.featureGrid}>
            {FEATURES.map(({ key, icon: Icon }) => (
              <article key={key} className={styles.featureCard} data-reveal data-spotlight>
                <span className={styles.featureIcon}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h4>{t(`features.items.${key}.title`)}</h4>
                <p>{t(`features.items.${key}.text`)}</p>
              </article>
            ))}
          </div>

        </section>

        <section id="audience" className={styles.section} aria-labelledby="audience-title">
          <div className={styles.sectionIntro} data-reveal>
            <h2 id="audience-title" className={styles.sectionTitle}>
              {t("audience.title")}
            </h2>
            <p>{t("audience.description")}</p>
          </div>

          <div className={styles.audienceGrid}>
            {AUDIENCES.map(({ key, icon: Icon }) => (
              <article key={key} className={styles.audienceItem} data-reveal data-spotlight>
                <div className={styles.audienceHead}>
                  <span className={styles.featureIcon}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3>{t(`audience.roles.${key}.title`)}</h3>
                </div>
                <ul>
                  {["first", "second", "third"].map((point) => (
                    <li key={point}>{t(`audience.roles.${key}.${point}`)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className={styles.section} aria-labelledby="how-title">
          <div className={styles.sectionIntro} data-reveal>
            <h2 id="how-title" className={styles.sectionTitle}>
              {t("how.title")}
            </h2>
            <p>{t("how.description")}</p>
          </div>

          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step} data-reveal data-spotlight>
                <span className={styles.stepNumber}>{index + 1}</span>
                <h3>{t(`how.steps.${step}.title`)}</h3>
                <p>{t(`how.steps.${step}.text`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="benefits-title">
          <div className={styles.sectionIntro} data-reveal>
            <h2 id="benefits-title" className={styles.sectionTitle}>
              {t("benefits.title")}
            </h2>
          </div>

          <ul className={styles.benefits}>
            {BENEFITS.map(({ key, icon: Icon }) => (
              <li key={key} data-reveal data-spotlight>
                <Icon size={20} aria-hidden="true" />
                <strong>{t(`benefits.items.${key}.title`)}</strong>
                <span>{t(`benefits.items.${key}.text`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="access" className={styles.access} aria-labelledby="access-title">
          <div className={styles.accessInner} data-reveal data-spotlight="layer">
            <span data-spotlight-glow aria-hidden="true" />
            <div className={styles.accessCopy}>
              <h2 id="access-title" className={styles.accessTitle}>
                {t("access.title")}
              </h2>
              <p>{t("access.description")}</p>
              <div className={styles.accessActions}>
                <Link href="/login" className={`${styles.buttonPrimary} ${styles.buttonLarge}`}>
                  {t("nav.login")}
                </Link>
                <Link href="/register" className={`${styles.buttonGhost} ${styles.buttonLarge}`}>
                  {t("access.register")}
                </Link>
              </div>
            </div>

            <div className={styles.accessPaths}>
              <article data-spotlight>
                <span className={styles.featureIcon}>
                  <UserRound size={20} aria-hidden="true" />
                </span>
                <h3>{t("access.staff.title")}</h3>
                <p>{t("access.staff.text")}</p>
              </article>
              <article data-spotlight>
                <span className={styles.featureIcon}>
                  <KeyRound size={20} aria-hidden="true" />
                </span>
                <h3>{t("access.parents.title")}</h3>
                <p>{t("access.parents.text")}</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Logo theme="dark" />
            <p>{t("footer.description")}</p>
          </div>
          <nav aria-label={t("footer.navLabel")} className={styles.footerNav}>
            <a href="#features">{t("nav.features")}</a>
            <a href="#audience">{t("nav.audience")}</a>
            <a href="#how">{t("nav.how")}</a>
            <a href="#access">{t("nav.access")}</a>
            <Link href="/login">{t("nav.login")}</Link>
          </nav>
        </div>
        <p className={styles.footerNote}>{t("footer.note")}</p>
      </footer>
    </div>
  );
};

export default Landing;
