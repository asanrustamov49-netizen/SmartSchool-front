import { useId } from "react";
import { cn } from "@/lib/utils";
import styles from "./Logo.module.scss";

type LogoProps = {
  // icon — только знак (он же favicon), full — знак с надписью SmartSchool.
  variant?: "icon" | "full";
  // Тема меняет цвет слова Smart. auto — следует теме приложения (класс .dark на html).
  theme?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Фирменный знак: открытая книга, из которой растут столбики успеваемости,
// жёлтая стрелка роста и звезда достижений на градиентной плашке.
// Пути рисуются в сетке 64×64, поэтому знак одинаково чёткий в любом размере.
// Те же пути — в src/app/icon.svg (favicon).
function Mark({ id }: { id: string }) {
  return (
    <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        {/* Плашка следует акцентному цвету из настроек; без токенов — фирменный градиент. */}
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--ss-accent, #4C6FFF)" }} />
          <stop offset="1" style={{ stopColor: "var(--ss-violet, #7B5CFA)" }} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-page`} x1="0" y1="20" x2="0" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#E4E3FF" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="15" fill={`url(#${id}-plate)`} />
      <rect width="64" height="64" rx="15" fill={`url(#${id}-shine)`} />

      {/* Нижние страницы книги */}
      <path
        d="M7 46.5C17 42.5 26 44 32 50.5 38 44 47 42.5 57 46.5V52C47 49 38 50 32 56 26 50 17 49 7 52Z"
        fill="#fff"
        fillOpacity=".45"
      />
      <path d="M10 43c8-3.5 16-2.5 22 4v4.5c-6-5.5-14-6.5-22-4Z" fill={`url(#${id}-page)`} />
      <path d="M54 43c-8-3.5-16-2.5-22 4v4.5c6-5.5 14-6.5 22-4Z" fill={`url(#${id}-page)`} />

      {/* Перелистываемая страница слева */}
      <path d="M13 22.5c8 0 14.5 4 17.5 11V45c-4-4.5-10.5-6.2-17.5-5.8Z" fill={`url(#${id}-page)`} />

      {/* Столбики успеваемости */}
      <rect x="34.5" y="36" width="5" height="9.5" rx="1.4" fill="#fff" />
      <rect x="41.5" y="30.5" width="5" height="14" rx="1.4" fill="#fff" />
      <rect x="48.5" y="24.5" width="5" height="19.5" rx="1.4" fill="#fff" />

      {/* Стрелка роста */}
      <path
        className={styles.arrow}
        d="M17 40c11-2.5 23-10 33.5-23.5"
        fill="none"
        stroke="#FFC83D"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path d="M53.8 12.3 53.4 20.2 46.4 14.6Z" fill="#FFC83D" stroke="#FFC83D" strokeWidth="1.6" strokeLinejoin="round" />

      {/* Звезда достижений */}
      <path
        className={styles.star}
        d="M18 7.5Q19.2 13.8 25.5 15 19.2 16.2 18 22.5 16.8 16.2 10.5 15 16.8 13.8 18 7.5Z"
        fill="#FFC83D"
      />
    </svg>
  );
}

export function Logo({ variant = "full", theme = "auto", size = "md", className }: LogoProps) {
  const id = useId().replace(/:/g, "");

  return (
    <span
      className={cn(styles.logo, styles[size], styles[theme], className)}
      role="img"
      aria-label="SmartSchool"
    >
      <Mark id={id} />
      {variant === "full" && (
        <span className={styles.wordmark} aria-hidden="true">
          Smart<span className={styles.wordmarkAccent}>School</span>
        </span>
      )}
    </span>
  );
}
