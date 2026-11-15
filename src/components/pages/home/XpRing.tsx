import type { CSSProperties, ReactNode } from "react";
import scss from "./home.module.scss";

type XpRingProps = {
  value: number;
  max: number;
  size?: number;
  children: ReactNode;
};

// Кольцо прогресса: доля value от max (например, XP ученика относительно лидера школы).
export function XpRing({ value, max, size = 132, children }: XpRingProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className={scss.xpRing}
      style={{ width: size, height: size, "--ring-percent": percent } as CSSProperties}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="xp-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            {/* Кольцо следует акцентному цвету из настроек. */}
            <stop offset="0" style={{ stopColor: "var(--ss-accent, #2f6bff)" }} />
            <stop offset="1" style={{ stopColor: "var(--ss-violet, #a855f7)" }} />
          </linearGradient>
        </defs>
        <circle className={scss.xpRingTrack} cx="60" cy="60" r="50" pathLength={100} />
        <circle className={scss.xpRingValue} cx="60" cy="60" r="50" pathLength={100} />
      </svg>
      <div className={scss.xpRingCenter}>{children}</div>
    </div>
  );
}
