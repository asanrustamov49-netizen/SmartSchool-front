import type { LucideIcon } from "lucide-react";
import scss from "./home.module.scss";

type MetricCardProps = {
  icon: LucideIcon;
  value: number | string;
  label: string;
};

export function MetricCard({ icon: Icon, value, label }: MetricCardProps) {
  return (
    <article className={scss.metric}>
      <span className={scss.metricIcon}>
        <Icon size={24} strokeWidth={2} aria-hidden="true" />
      </span>
      <div className={scss.metricCopy}>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}
