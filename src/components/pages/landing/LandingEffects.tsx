"use client";

import { useEffect } from "react";

// Эффекты Landing без библиотек:
// 1) элементы с data-reveal плавно появляются при прокрутке (IntersectionObserver, один раз);
// 2) элемент с data-tilt слегка наклоняется за курсором (только мышь, через requestAnimationFrame).
// Пока компонент не запущен, контент виден полностью — скрытие включается атрибутом data-effects.
export function LandingEffects() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("[data-landing]");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!page || prefersReducedMotion) {
      return;
    }

    page.dataset.effects = "on";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    page.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));

    const tiltTarget = page.querySelector<HTMLElement>("[data-tilt]");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      if (!tiltTarget) {
        return;
      }

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        tiltTarget.style.setProperty("--tilt-x", x.toFixed(3));
        tiltTarget.style.setProperty("--tilt-y", y.toFixed(3));
      });
    };

    if (tiltTarget && canHover) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return null;
}
