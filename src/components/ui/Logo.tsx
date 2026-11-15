import { useId } from "react";
import { cn } from "@/lib/utils";
import styles from "./Logo.module.scss";

type LogoProps = {
  // icon — компактный знак на градиентной плашке (он же favicon),
  // full — детальный знак с надписью SmartSchool.
  variant?: "icon" | "full";
  // Тема меняет только «чернила»: силуэт ученика и слово Smart.
  // auto — следует теме приложения (класс .dark на html).
  theme?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Фирменный знак: академическая шапка, ученик, тянущийся вверх, открытая книга и звезда.
// Пути рисуются в сетке 64×64, поэтому знак одинаково чёткий в любом размере.
function FullMark({ id }: { id: string }) {
  return (
    <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-book`} x1="4" y1="40" x2="60" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset=".5" stopColor="#2F6BFF" />
          <stop offset="1" stopColor="#7C5CFF" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="4" y1="12" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2F6BFF" />
        </linearGradient>
      </defs>
      <path d="M3 21 27 11l23 8-24 10Z" fill={`url(#${id}-cap)`} />
      <path d="M9 23.5V29" stroke={`url(#${id}-cap)`} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 28.5c1.6 0 2.4 1.8 2.6 4.6H6.4c.2-2.8 1-4.6 2.6-4.6Z" fill={`url(#${id}-cap)`} />
      <circle className={styles.ink} cx="29" cy="31.5" r="4.6" />
      <path
        className={styles.ink}
        d="M16 37.5c5 0 9.5 2.6 13.4 7.6C34.6 33.6 41 24 49.5 16.5 43.8 27 38.2 38 33.4 49.6c-1.2 3-4 3-5.5.4C24.6 44.2 20.8 40 16 37.5Z"
      />
      <path d="M4 42c9-3.5 20-2.5 28 7v4.2C24 45 13 44.5 4 47.5Z" fill={`url(#${id}-book)`} />
      <path d="M60 42c-9-3.5-20-2.5-28 7v4.2C40 45 51 44.5 60 47.5Z" fill={`url(#${id}-book)`} />
      <path d="M4 50.5c10-2 20-.5 28 7C23 53.5 13 53.5 4 55Z" fill={`url(#${id}-book)`} />
      <path d="M60 50.5c-10-2-20-.5-28 7C41 53.5 51 53.5 60 55Z" fill={`url(#${id}-book)`} />
      <path className={styles.star} d="m55 3 1.5 4.5L61 9l-4.5 1.5L55 15l-1.5-4.5L49 9l4.5-1.5Z" fill="#F5B935" />
    </svg>
  );
}

// Упрощённый знак без шапки и второго слоя страниц: остаётся узнаваемым даже в 16×16.
function IconMark({ id }: { id: string }) {
  return (
    <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        {/* Плашка следует акцентному цвету из настроек; без токенов — фирменный градиент. */}
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--ss-accent, #2F6BFF)" }} />
          <stop offset="1" style={{ stopColor: "var(--ss-violet, #7C5CFF)" }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-plate)`} />
      <circle cx="25" cy="24" r="5.5" fill="#fff" />
      <path
        d="M10 31c6 0 11.5 3 16 9C32 26 39.5 15 49.5 6.5 43 19 36.5 32 31 45.5c-1.4 3.5-4.8 3.5-6.5.5C21 39 16 33.5 10 31Z"
        fill="#fff"
      />
      <path d="M6 44c9-3.5 18-2 26 6.5v5C24 48 15 47 6 50Z" fill="#fff" fillOpacity=".85" />
      <path d="M58 44c-9-3.5-18-2-26 6.5v5C40 48 49 47 58 50Z" fill="#fff" fillOpacity=".85" />
      <path className={styles.star} d="m52 7 2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2Z" fill="#FFC83D" />
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
      {variant === "icon" ? <IconMark id={id} /> : <FullMark id={id} />}
      {variant === "full" && (
        <span className={styles.wordmark} aria-hidden="true">
          Smart<span className={styles.wordmarkAccent}>School</span>
        </span>
      )}
    </span>
  );
}
