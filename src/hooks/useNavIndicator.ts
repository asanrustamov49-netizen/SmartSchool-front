import { useLayoutEffect, useRef } from "react";

// Плашка активного пункта бокового меню: одна на весь список, она плавно «переезжает»
// к новому пункту при смене страницы. Позиция берётся из DOM (offsetTop / offsetHeight)
// и пишется прямо в style плашки — без state, чтобы не перерисовывать меню.
// activeKey меняется при переходе; layoutKey — когда меняется раскладка (свёрнутое меню).
export function useNavIndicator(activeKey: string | undefined, layoutKey: string) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) {
      return;
    }

    const moveToActive = () => {
      const active = list.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "1";
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translateY(${active.offsetTop}px)`;
    };

    moveToActive();
    // Блик проходит по плашке после каждого перехода: атрибут снимается и ставится заново.
    indicator.removeAttribute("data-shine");
    void indicator.offsetWidth;
    indicator.setAttribute("data-shine", "");
    // Первое появление — без анимации, дальше плашка едет (см. [data-ready] в стилях).
    const frame = requestAnimationFrame(() => {
      indicator.dataset.ready = "true";
    });

    // Пересчёт, если высота меню изменилась (шрифты загрузились, меню свернули).
    const observer = new ResizeObserver(moveToActive);
    observer.observe(list);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeKey, layoutKey]);

  return { listRef, indicatorRef };
}
