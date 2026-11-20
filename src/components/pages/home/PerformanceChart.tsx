"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import type { PerformancePeriod, PerformancePoint } from "@/apis/dashboard.api";
import { DataState } from "@/components/ui/DataState";
import { usePerformance } from "@/hooks/useDashboard";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import scss from "./home.module.scss";

const PERIODS: PerformancePeriod[] = ["week", "month", "year"];
// Когда точек немного, значение подписано над каждой; иначе — только у последней и выбранной.
const LABEL_ALL_LIMIT = 7;

type ChartPoint = PerformancePoint & { index: number; percent: number };

function getAxisMin(points: ChartPoint[]): number {
  const minValue = Math.min(...points.map((point) => point.percent));
  return Math.max(0, Math.floor((minValue - 5) / 20) * 20);
}

// График директора: успеваемость школы (средний балл в процентах) по дням или месяцам.
// Линия и заливка — SVG, растянутый на всю ширину; точки и подписи — HTML поверх,
// поэтому они не искажаются при любой ширине экрана.
export function PerformanceChart() {
  const t = useTranslations("dashboard.performance");
  const tDates = useTranslations("dates");
  const tApiErrors = useTranslations("apiErrors");
  const [period, setPeriod] = useState<PerformancePeriod>("week");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const performanceQuery = usePerformance(period);

  const monthNamesRaw: unknown = tDates.raw("monthNames");
  const monthNames = Array.isArray(monthNamesRaw) ? monthNamesRaw.map(String) : [];

  const formatLabel = (date: string) => {
    const [, month, day] = date.split("-");
    if (period === "year") {
      return (monthNames[Number(month) - 1] ?? month).slice(0, 3);
    }
    return `${day}.${month}`;
  };

  const changePeriod = (nextPeriod: PerformancePeriod) => {
    setPeriod(nextPeriod);
    setActiveIndex(null);
  };

  const renderChart = (allPoints: PerformancePoint[]) => {
    const points: ChartPoint[] = [];
    allPoints.forEach((point, index) => {
      if (point.percent !== null) {
        points.push({ ...point, index, percent: point.percent });
      }
    });

    if (points.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    const axisMin = getAxisMin(points);
    const ticks: number[] = [];
    for (let tick = 100; tick >= axisMin; tick -= 20) {
      ticks.push(tick);
    }
    const lastIndex = allPoints.length - 1;
    // Координаты в процентах от области графика: x — по порядку дня, y — по значению.
    const getX = (index: number) => (lastIndex === 0 ? 50 : (index / lastIndex) * 100);
    const getY = (percent: number) => 100 - ((percent - axisMin) / (100 - axisMin)) * 100;

    const linePath = points.map((point, order) => `${order === 0 ? "M" : "L"}${getX(point.index)},${getY(point.percent)}`).join(" ");
    const areaPath = `${linePath} L${getX(points[points.length - 1].index)},100 L${getX(points[0].index)},100 Z`;
    const labelEvery = Math.ceil(allPoints.length / 7);
    const active = points.find((point) => point.index === activeIndex) ?? null;

    return (
      <div className={scss.perfChart}>
        <ul className={scss.perfAxis} aria-hidden="true">
          {ticks.map((tick) => (
            <li key={tick} style={{ "--y": `${getY(tick)}%` } as CSSProperties}>
              {tick}
            </li>
          ))}
        </ul>

        <div className={scss.perfPlot} onMouseLeave={() => setActiveIndex(null)}>
          {ticks.map((tick) => (
            <span key={tick} className={scss.perfGridLine} style={{ "--y": `${getY(tick)}%` } as CSSProperties} />
          ))}

          <svg className={scss.perfSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="performance-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ss-accent)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--ss-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#performance-fill)" />
            <path d={linePath} className={scss.perfLine} />
          </svg>

          {points.map((point) => {
            const isLast = point.index === points[points.length - 1].index;
            const isActive = point.index === activeIndex;
            const showValue = points.length <= LABEL_ALL_LIMIT || isLast || isActive;
            return (
              <button
                key={point.date}
                type="button"
                className={cn(scss.perfPoint, isLast && scss.perfPointLast, isActive && scss.perfPointActive)}
                style={{ "--x": `${getX(point.index)}%`, "--y": `${getY(point.percent)}%` } as CSSProperties}
                aria-label={`${formatLabel(point.date)}: ${point.percent}%`}
                onMouseEnter={() => setActiveIndex(point.index)}
                onFocus={() => setActiveIndex(point.index)}
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(isActive ? null : point.index)}
              >
                {showValue && <span className={scss.perfBubble}>{point.percent}</span>}
              </button>
            );
          })}

          {active && (
            <div
              className={cn(scss.perfTooltip, getX(active.index) > 70 && scss.perfTooltipLeft)}
              style={{ "--x": `${getX(active.index)}%`, "--y": `${getY(active.percent)}%` } as CSSProperties}
              role="status"
            >
              <strong>{formatLabel(active.date)}</strong>
              <span>{t("average", { value: active.average?.toFixed(2) ?? "—" })}</span>
              {active.attendance_percent !== null && (
                <span>{t("attendanceValue", { value: active.attendance_percent })}</span>
              )}
              <span>{t("gradesCount", { count: active.grades_count })}</span>
            </div>
          )}
        </div>

        <ol className={scss.perfLabels} aria-hidden="true">
          {allPoints.map((point, index) => (
            <li key={point.date} style={{ "--x": `${getX(index)}%` } as CSSProperties}>
              {index % labelEvery === 0 || index === lastIndex ? formatLabel(point.date) : ""}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const renderSummary = (allPoints: PerformancePoint[]) => {
    const withValues = allPoints.filter((point) => point.percent !== null);
    if (withValues.length === 0) {
      return null;
    }
    const latest = withValues[withValues.length - 1].percent ?? 0;
    const previous = withValues.length > 1 ? (withValues[withValues.length - 2].percent ?? latest) : latest;
    const change = latest - previous;
    const attendanceValues = allPoints
      .map((point) => point.attendance_percent)
      .filter((value): value is number => value !== null);
    const attendance =
      attendanceValues.length > 0
        ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
        : null;

    return (
      <dl className={scss.perfSummary}>
        <div>
          <dt>{t("latest")}</dt>
          <dd>
            {latest}%
            {change !== 0 && (
              <span className={cn(scss.perfChange, change < 0 && scss.perfChangeDown)} title={t("change")}>
                {change > 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                {change > 0 ? `+${change}` : change}
              </span>
            )}
          </dd>
        </div>
        {attendance !== null && (
          <div>
            <dt>{t("attendance")}</dt>
            <dd>{attendance}%</dd>
          </div>
        )}
      </dl>
    );
  };

  const renderContent = () => {
    if (performanceQuery.isPending) {
      return <DataState status="loading" />;
    }
    if (performanceQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(performanceQuery.error, tApiErrors)}
          onRetry={() => performanceQuery.refetch()}
        />
      );
    }
    return (
      <>
        {renderSummary(performanceQuery.data)}
        {renderChart(performanceQuery.data)}
      </>
    );
  };

  return (
    <section className={scss.panel}>
      <div className={scss.perfHeading}>
        <div>
          <h2>
            <TrendingUp size={18} aria-hidden="true" />
            {t("title")}
          </h2>
          <p>{t("subtitle")}</p>
        </div>
        <div className={scss.perfPeriods} role="tablist" aria-label={t("periodLabel")}>
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={period === item}
              className={cn(period === item && scss.perfPeriodActive)}
              onClick={() => changePeriod(item)}
            >
              {t(`periods.${item}`)}
            </button>
          ))}
        </div>
      </div>
      {renderContent()}
    </section>
  );
}
