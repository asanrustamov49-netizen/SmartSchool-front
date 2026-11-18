import type { z } from "zod";

// Проверка текстов, которые пишут пользователи: грубые слова, случайный набор букв, лишние символы.
// Такая же проверка есть на backend (SmartSchool: mysite/services/text_checks.py) —
// списки слов нужно менять в обоих местах.
// shortcut: список ловит частые грубости и обходы, но не все — модерацию он не заменяет.

export type TextProblem = "invalidChars" | "nameChars" | "classLetter" | "gibberish" | "inappropriate" | "subjectInappropriate";

// Похожие латинские буквы и цифры, которыми обходят фильтр: «xуй», «п1зда», «c@ка».
const LOOKALIKES: Record<string, string> = {
  a: "а", b: "в", c: "с", e: "е", h: "н", i: "и", k: "к", m: "м", o: "о", p: "р", t: "т",
  u: "у", x: "х", y: "у", "0": "о", "1": "и", "3": "з", "4": "ч", "6": "б", "@": "а", ё: "е",
};

// Корни, которые недопустимы в любом месте слова (ru, ky).
const BLOCKED_ROOTS = [
  "хуй", "хуе", "хуя", "хуи", "пизд", "залуп", "гандон", "шлюх", "пидор", "пидар", "педик", "дроч",
  "ебан", "ебал", "ебат", "ебуч", "еблан", "уеб", "заеб", "выеб", "наеб", "проеб", "мудак", "мудил",
  "говн", "дерьм", "сран", "срат", "жопа", "жопы", "жопу", "секс", "порн", "курв", "блят", "бляд",
  "сучк", "сучар", "кутак", "котак", "жалап", "сигиш", "сигип",
];

// Начала слов: внутри других слов они встречаются в нормальных словах («небо», «Херсон»).
const BLOCKED_WORD_STARTS = ["еб", "бля", "сука", "суки", "сик", "дебил", "идиот", "пидр", "чмо"];
const BLOCKED_WORDS = ["хер", "лох", "амың", "амыңды", "дурак", "дура", "тупой"];

const BLOCKED_LATIN_ROOTS = ["fuck", "fck", "shit", "bitch", "cunt", "porn", "pussy", "whore", "nigg", "dick", "penis"];
const BLOCKED_LATIN_WORDS = ["ass", "sex", "xxx", "cock", "fag", "slut", "boobs"];

const NAME_CHARACTERS = /^[\p{L}\s'ʼ’.-]+$/u;
const CLASS_LETTER = /^\p{L}{1,3}$/u;
const REPEATED_LETTER = /(\p{L})\1\1/u;

function toCyrillicLookalikes(text: string) {
  return [...text].map((letter) => LOOKALIKES[letter] ?? letter).join("");
}

function countLetters(text: string) {
  return (text.match(/\p{L}/gu) ?? []).length;
}

// joinWords — проверять и слитно («х у й»). Для длинного текста выключено:
// стык обычных слов мог бы случайно дать грубый корень.
export function hasInappropriateWords(text: string, joinWords = true) {
  const lowerText = text.toLowerCase();
  const cyrillicWords = toCyrillicLookalikes(lowerText).split(/[^\p{L}]+/u).filter(Boolean);
  const latinWords = lowerText.split(/[^a-z]+/).filter(Boolean);
  const cyrillicParts = joinWords ? [cyrillicWords.join("")] : cyrillicWords;
  const latinParts = joinWords ? [latinWords.join("")] : latinWords;

  return (
    cyrillicParts.some((part) => BLOCKED_ROOTS.some((root) => part.includes(root))) ||
    cyrillicWords.some(
      (word) => BLOCKED_WORDS.includes(word) || BLOCKED_WORD_STARTS.some((start) => word.startsWith(start)),
    ) ||
    latinParts.some((part) => BLOCKED_LATIN_ROOTS.some((root) => part.includes(root))) ||
    latinWords.some((word) => BLOCKED_LATIN_WORDS.includes(word))
  );
}

// «Асанов Бакыт уулу», «O'Neil», «Анна-Мария»: только буквы, пробел, дефис и апостроф.
export function validatePersonName(name: string): TextProblem | null {
  const trimmedName = name.trim();
  if (!NAME_CHARACTERS.test(trimmedName) || countLetters(trimmedName) < 2) {
    return "nameChars";
  }
  if (REPEATED_LETTER.test(trimmedName.toLowerCase())) {
    return "gibberish";
  }
  if (hasInappropriateWords(trimmedName)) {
    return "inappropriate";
  }
  return null;
}

// Буква класса: «А», «Б», «Ө».
export function validateClassLetter(letter: string): TextProblem | null {
  const trimmedLetter = letter.trim();
  if (!CLASS_LETTER.test(trimmedLetter)) {
    return "classLetter";
  }
  return hasInappropriateWords(trimmedLetter) ? "inappropriate" : null;
}

// Свободный текст (объявления, задания, комментарии) — только грубые слова.
export function validateFreeText(text: string): TextProblem | null {
  return hasInappropriateWords(text, false) ? "inappropriate" : null;
}

// Для zod: .superRefine(textRule(validatePersonName, (problem) => tChecks(problem)))
export function textRule(validate: (text: string) => TextProblem | null, translate: (problem: TextProblem) => string) {
  return (text: string, context: z.RefinementCtx) => {
    const problem = validate(text);
    if (problem) {
      context.addIssue({ code: "custom", message: translate(problem) });
    }
  };
}
