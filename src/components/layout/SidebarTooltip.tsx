"use client";

import { useEffect, useState } from "react";
import styles from "./SidebarTooltip.module.scss";

type TooltipState = {
  text: string;
  shortcut?: string;
  top: number;
  left: number;
};

// Подсказка справа от элемента бокового меню с атрибутом data-tooltip.
// Позиция fixed: список разделов прокручивается и обрезал бы обычную CSS-подсказку.
export function SidebarTooltip({ containerId }: { containerId: string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const showFor = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      setTooltip({
        text: target.dataset.tooltip ?? "",
        shortcut: target.dataset.tooltipShortcut,
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tooltip]") : null;
      if (target && container.contains(target)) {
        showFor(target);
      } else {
        setTooltip(null);
      }
    };

    // С клавиатуры подсказка тоже нужна, а после клика мышью — нет.
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.dataset.tooltip && target.matches(":focus-visible")) {
        showFor(target);
      }
    };

    const hide = () => setTooltip(null);

    container.addEventListener("pointerover", handlePointerOver);
    container.addEventListener("pointerleave", hide);
    container.addEventListener("pointerdown", hide);
    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", hide);
    container.addEventListener("scroll", hide, true);

    return () => {
      container.removeEventListener("pointerover", handlePointerOver);
      container.removeEventListener("pointerleave", hide);
      container.removeEventListener("pointerdown", hide);
      container.removeEventListener("focusin", handleFocusIn);
      container.removeEventListener("focusout", hide);
      container.removeEventListener("scroll", hide, true);
    };
  }, [containerId]);

  if (!tooltip) return null;

  return (
    <div className={styles.tooltip} style={{ top: tooltip.top, left: tooltip.left }} aria-hidden="true">
      <span>{tooltip.text}</span>
      {tooltip.shortcut && <kbd className={styles.shortcut}>{tooltip.shortcut}</kbd>}
    </div>
  );
}
