import { useEffect } from "react";

// Подсветка, которая следует за курсором по карточкам и баннерам.
// Один обработчик на документ: он находит под курсором блоки по selector,
// помечает их атрибутом data-spotlight и передаёт координаты в --spot-x / --spot-y.
// Сам свет рисует CSS в globals.css. На сенсорных экранах курсора нет — эффект выключен.
export function useSpotlight(selector: string) {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let frame = 0;
    let lastEvent: PointerEvent | null = null;

    const update = () => {
      frame = 0;
      if (!lastEvent || !(lastEvent.target instanceof Element)) {
        return;
      }

      // Вложенные блоки (карточка внутри панели) подсвечиваются вместе с внешним.
      let element = lastEvent.target.closest<HTMLElement>(selector);
      while (element) {
        if (!element.hasAttribute("data-spotlight")) {
          element.setAttribute("data-spotlight", "");
        }
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--spot-x", `${lastEvent.clientX - rect.left}px`);
        element.style.setProperty("--spot-y", `${lastEvent.clientY - rect.top}px`);
        element = element.parentElement?.closest<HTMLElement>(selector) ?? null;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      lastEvent = event;
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, [selector]);
}
