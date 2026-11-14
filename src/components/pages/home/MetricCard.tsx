import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import scss from "./home.module.scss";

export type MetricTone = "blue" | "violet" | "sky" | "amber";

type MetricCardProps = {
  icon: LucideIcon;
  value: number | string;
  label: string;
  tone?: MetricTone;
};

const TONE_CLASS: Record<MetricTone, string> = {
  blue: scss.toneBlue,
  violet: scss.toneViolet,
  sky: scss.toneSky,
  amber: scss.toneAmber,
};

// Числа «добегают» до значения чистым CSS (@property --metric-value), без JS.
// Настоящее значение дублируется для скринридеров.
export function MetricCard({ icon: Icon, value, label, tone = "blue" }: MetricCardProps) {
  const isNumber = typeof value === "number";

  return (
    <article className={`${scss.metric} ${TONE_CLASS[tone]}`}>
      <span className={scss.metricIcon}>
        <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <div className={scss.metricCopy}>
        {isNumber ? (
          <strong>
            <span
              className={scss.metricCounter}
              style={{ "--metric-target": value } as CSSProperties}
              aria-hidden="true"
            />
            <span className="sr-only">{value}</span>
          </strong>
        ) : (
          <strong>{value}</strong>
        )}
        <span>{label}</span>
      </div>
    </article>
  );
}
