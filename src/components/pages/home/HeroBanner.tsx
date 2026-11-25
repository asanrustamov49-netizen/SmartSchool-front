"use client";

import { Check, Move, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { BannerPosition as SavedBannerPosition } from "@/apis/auth.api";
import { useUpdateProfile } from "@/hooks/useProfile";
import { getMediaUrl } from "@/lib/utils";
import scss from "./home.module.scss";

const KEYBOARD_STEP = 2;

type BannerPosition = { x: number; y: number };

const DEFAULT_BANNER_POSITION: BannerPosition = { x: 50, y: 50 };

type DragStart = { pointerX: number; pointerY: number; position: BannerPosition };

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

// Баннер школы на главной. Снимок у всех один, а положение каждый настраивает себе сам:
// перетаскивает снимок мышью или пальцем (или стрелками), и видит только свой вариант.
// Положение хранится в аккаунте, поэтому одинаково на телефоне и компьютере.
type HeroBannerProps = { bannerUrl: string; saved: SavedBannerPosition | null };

export function HeroBanner({ bannerUrl, saved }: HeroBannerProps) {
  const t = useTranslations("dashboard.hero.banner");
  const updateProfile = useUpdateProfile();
  // Положение, сохранённое для прежнего баннера школы, к новому не применяется.
  const savedPosition = saved && saved.url === bannerUrl ? { x: saved.x, y: saved.y } : DEFAULT_BANNER_POSITION;
  const [draft, setDraft] = useState<BannerPosition | null>(null);
  const dragStart = useRef<DragStart | null>(null);
  const isEditing = draft !== null;
  const position = draft ?? savedPosition;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draft) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, position: draft };
  };

  // Снимок «едет» за пальцем: сдвиг вправо показывает больше левой части снимка.
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) {
      return;
    }
    const area = event.currentTarget.getBoundingClientRect();
    setDraft({
      x: clampPercent(start.position.x - ((event.clientX - start.pointerX) / area.width) * 100),
      y: clampPercent(start.position.y - ((event.clientY - start.pointerY) / area.height) * 100),
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const shifts: Record<string, [number, number]> = {
      ArrowLeft: [KEYBOARD_STEP, 0],
      ArrowRight: [-KEYBOARD_STEP, 0],
      ArrowUp: [0, KEYBOARD_STEP],
      ArrowDown: [0, -KEYBOARD_STEP],
    };
    const shift = shifts[event.key];
    if (!draft || !shift) {
      return;
    }
    event.preventDefault();
    setDraft({ x: clampPercent(draft.x + shift[0]), y: clampPercent(draft.y + shift[1]) });
  };

  const save = () => {
    if (!draft) {
      return;
    }
    updateProfile.mutate(
      { banner_position: { url: bannerUrl, x: Math.round(draft.x), y: Math.round(draft.y) } },
      { onSuccess: () => setDraft(null) },
    );
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API */}
      <img
        className={scss.heroBanner}
        src={getMediaUrl(bannerUrl)}
        alt=""
        // Положение выбирает пользователь, поэтому оно задаётся здесь, а не в SCSS.
        style={{ objectPosition: `${position.x}% ${position.y}%` }}
      />
      {!isEditing && <span className={scss.heroBannerShade} aria-hidden="true" />}

      {isEditing ? (
        <div
          className={scss.bannerEditor}
          role="group"
          aria-label={t("editorLabel")}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => (dragStart.current = null)}
          onPointerCancel={() => (dragStart.current = null)}
          onKeyDown={handleKeyDown}
        >
          <span className={scss.bannerEditorHint}>
            <Move size={16} aria-hidden="true" />
            {t("hint")}
          </span>
          <div className={scss.bannerEditorActions} onPointerDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setDraft(DEFAULT_BANNER_POSITION)}>
              <RotateCcw size={15} aria-hidden="true" />
              {t("reset")}
            </button>
            <button type="button" onClick={() => setDraft(null)}>
              <X size={15} aria-hidden="true" />
              {t("cancel")}
            </button>
            <button type="button" className={scss.bannerEditorSave} onClick={save} disabled={updateProfile.isPending}>
              <Check size={15} aria-hidden="true" />
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={scss.bannerEditButton}
          onClick={() => setDraft(savedPosition)}
          aria-label={t("edit")}
          title={t("edit")}
        >
          <Move size={16} aria-hidden="true" />
        </button>
      )}
    </>
  );
}
