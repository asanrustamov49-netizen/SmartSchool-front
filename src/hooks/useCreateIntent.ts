"use client";

import { useEffect, useEffectEvent } from "react";

export type CreateIntent = "student" | "teacher" | "class" | "subject" | "announcement" | "homework";

// Команда «Добавить …» из быстрого поиска (Ctrl K): палитра запоминает намерение и
// переходит на страницу, а страница открывает форму создания — сразу, если уже открыта,
// или когда станет видимой.
let pendingIntent: CreateIntent | null = null;
const listeners = new Set<() => void>();

export function requestCreate(intent: CreateIntent) {
  pendingIntent = intent;
  for (const listener of listeners) {
    listener();
  }
}

export function useCreateIntent(intent: CreateIntent, openForm: () => void, enabled = true) {
  const consumeIntent = useEffectEvent(() => {
    if (pendingIntent === intent) {
      pendingIntent = null;
      openForm();
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const listener = () => consumeIntent();
    listener();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [enabled]);
}
