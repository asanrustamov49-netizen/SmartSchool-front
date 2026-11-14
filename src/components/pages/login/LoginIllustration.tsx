"use client";

import { Award, Check, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import styles from "./LoginIllustration.module.scss";

// Сцена «Остров знаний» для экранов входа.
// Центральная иллюстрация собрана в <SceneArt />: чтобы заменить её на WebP или другой asset,
// достаточно отрисовать вместо неё <img>/<Image> — карточки, анимации и AuthLayout не меняются.
export function LoginIllustration() {
  const t = useTranslations("auth.illustration");
  const rootRef = useRef<HTMLDivElement>(null);

  // Лёгкий параллакс за курсором: только мышь, без prefers-reduced-motion, через requestAnimationFrame.
  useEffect(() => {
    const root = rootRef.current;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!root || !canHover || reducedMotion) {
      return;
    }

    let frame = 0;
    const handlePointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        root.style.setProperty("--px", x.toFixed(3));
        root.style.setProperty("--py", y.toFixed(3));
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <aside className={styles.visual} ref={rootRef}>
      <div className={`${styles.layer} ${styles.layerBack}`} aria-hidden="true">
        <span className={styles.glowA} />
        <span className={styles.glowB} />
      </div>

      <div className={`${styles.layer} ${styles.layerScene}`} aria-hidden="true">
        <SceneArt />
      </div>

      <div className={`${styles.layer} ${styles.layerCards}`} aria-hidden="true">
        <div className={`${styles.card} ${styles.cardGrade}`}>
          <span className={styles.gradeChip}>5</span>
          <span>
            <strong>{t("gradeTitle")}</strong>
            <small>
              <Check size={13} strokeWidth={3} />
              {t("gradeText")}
            </small>
          </span>
        </div>

        <div className={`${styles.card} ${styles.cardXp}`}>
          <strong>
            <Sparkles size={15} />
            XP
          </strong>
          <span className={styles.xpTrack}>
            <span />
          </span>
        </div>

        <div className={`${styles.card} ${styles.cardRating}`}>
          <span className={styles.medal}>
            <Award size={18} />
          </span>
          <strong>{t("rating")}</strong>
        </div>
      </div>

      <div className={styles.caption}>
        <p className={styles.slogan}>{t("slogan")}</p>
        <p className={styles.audience}>{t("audience")}</p>
      </div>
    </aside>
  );
}

// Векторная сцена. Каждый смысловой элемент — отдельная группа <g> с вложенной группой
// для анимации появления, поэтому части можно анимировать и заменять независимо.
function SceneArt() {
  return (
    <svg className={styles.art} viewBox="0 0 640 560" role="presentation">
      <defs>
        <linearGradient id="ss-island-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset="1" stopColor="#d9d3ff" />
        </linearGradient>
        <linearGradient id="ss-island-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c6bff" />
          <stop offset="0.55" stopColor="#3b34a8" />
          <stop offset="1" stopColor="#1b1a5e" />
        </linearGradient>
        <radialGradient id="ss-island-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ss-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2cc" />
          <stop offset="1" stopColor="#f3b48c" />
        </linearGradient>
        <linearGradient id="ss-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2f6e" />
          <stop offset="1" stopColor="#15112f" />
        </linearGradient>
        <linearGradient id="ss-hoodie-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b9bff" />
          <stop offset="1" stopColor="#2a55e8" />
        </linearGradient>
        <linearGradient id="ss-hoodie-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b09dff" />
          <stop offset="1" stopColor="#6d48ff" />
        </linearGradient>
        <linearGradient id="ss-pants" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26326b" />
          <stop offset="1" stopColor="#141a45" />
        </linearGradient>
        <linearGradient id="ss-laptop-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b4767" />
          <stop offset="1" stopColor="#1c2440" />
        </linearGradient>
        <linearGradient id="ss-laptop-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="ss-globe" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#a5e8ff" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3aa8" />
        </radialGradient>
        <linearGradient id="ss-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe28a" />
          <stop offset="1" stopColor="#f2a516" />
        </linearGradient>
        <radialGradient id="ss-star-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd75e" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffd75e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ss-book-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f8bff" />
          <stop offset="1" stopColor="#2a5be0" />
        </linearGradient>
        <linearGradient id="ss-book-violet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a7dff" />
          <stop offset="1" stopColor="#6a45f0" />
        </linearGradient>
        <linearGradient id="ss-book-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc24d" />
          <stop offset="1" stopColor="#e88d0c" />
        </linearGradient>
      </defs>

      {/* Остров: подсветка снизу, «скала» и верхняя площадка */}
      <g className={styles.gIsland}>
        <g className={styles.enter} style={{ animationDelay: "0.1s" }}>
          <g className={styles.idleIsland}>
            <ellipse cx="320" cy="512" rx="210" ry="38" fill="url(#ss-island-glow)" />
            <path d="M90 382 Q108 476 320 522 Q532 476 550 382 Z" fill="url(#ss-island-side)" />
            <path
              d="M120 420 Q200 470 320 482 Q440 470 520 420"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.12"
              strokeWidth="2"
            />
            <ellipse cx="320" cy="382" rx="230" ry="58" fill="url(#ss-island-top)" />
            <ellipse cx="320" cy="376" rx="214" ry="48" fill="#ffffff" fillOpacity="0.35" />
            <ellipse
              cx="320"
              cy="382"
              rx="229"
              ry="57"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.8"
              strokeWidth="1.5"
            />

            {/* Мягкие тени предметов на площадке */}
            <ellipse cx="222" cy="378" rx="86" ry="12" fill="#3b2f9e" fillOpacity="0.18" />
            <ellipse cx="322" cy="394" rx="40" ry="8" fill="#3b2f9e" fillOpacity="0.2" />
            <ellipse cx="432" cy="398" rx="44" ry="9" fill="#3b2f9e" fillOpacity="0.2" />

            {/* Стопка книг */}
            <g className={styles.gBooks}>
              <rect x="146" y="336" width="156" height="36" rx="7" fill="url(#ss-book-amber)" />
              <rect x="152" y="342" width="144" height="8" rx="3" fill="#fff6e3" />
              <rect x="146" y="358" width="156" height="4" fill="#000000" fillOpacity="0.08" />
              <g transform="rotate(-3 226 320)">
                <rect x="158" y="304" width="138" height="33" rx="7" fill="url(#ss-book-violet)" />
                <rect x="164" y="310" width="126" height="7" rx="3" fill="#f1edff" />
              </g>
              <g transform="rotate(2.5 226 288)">
                <rect x="166" y="274" width="124" height="31" rx="7" fill="url(#ss-book-blue)" />
                <rect x="172" y="280" width="112" height="7" rx="3" fill="#eaf1ff" />
                <rect x="268" y="274" width="8" height="31" fill="#ffffff" fillOpacity="0.25" />
              </g>
            </g>

            {/* Глобус */}
            <g className={styles.gGlobe}>
              <ellipse cx="322" cy="392" rx="28" ry="7" fill="url(#ss-gold)" />
              <rect x="317" y="372" width="10" height="20" rx="3" fill="#e0a21f" />
              <path
                d="M282 330 A42 42 0 0 0 360 366"
                fill="none"
                stroke="url(#ss-gold)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="322" cy="334" r="36" fill="url(#ss-globe)" />
              <path
                d="M300 318 C310 308 326 312 330 322 C334 332 322 336 314 340 C306 344 300 336 296 330 Z"
                fill="#c9f2ff"
                fillOpacity="0.85"
              />
              <path
                d="M334 344 C344 340 352 348 348 356 C344 362 336 360 332 354 Z"
                fill="#c9f2ff"
                fillOpacity="0.8"
              />
              <ellipse cx="310" cy="320" rx="10" ry="6" fill="#ffffff" fillOpacity="0.45" />
            </g>
          </g>
        </g>
      </g>

      {/* Ученик с ноутбуком, сидит на книгах */}
      <g className={styles.gStudentLaptop}>
        <g className={styles.enter} style={{ animationDelay: "0.45s" }}>
          {/* Ноги */}
          <path d="M214 262 L168 266 Q154 268 156 282 L160 330" fill="none" stroke="url(#ss-pants)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M238 264 L196 272 Q182 276 184 290 L186 332" fill="none" stroke="url(#ss-pants)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M146 334 Q146 326 158 326 L172 326 Q182 328 180 338 L148 340 Z" fill="#ffffff" />
          <path d="M146 338 L180 338 L180 342 L146 342 Z" fill="#7c5cff" />
          <path d="M174 336 Q174 328 186 328 L200 328 Q210 330 208 340 L176 342 Z" fill="#ffffff" />
          <path d="M174 340 L208 340 L208 344 L174 344 Z" fill="#7c5cff" />

          {/* Худи */}
          <path d="M194 270 C190 232 195 206 213 196 L245 196 C263 206 268 232 264 270 Z" fill="url(#ss-hoodie-blue)" />
          <path d="M214 198 Q229 214 244 198" fill="none" stroke="#1d47c9" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
          <path d="M226 206 L226 222" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
          <path d="M233 206 L233 220" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />

          {/* Голова */}
          <g className={styles.gHeadA}>
            <rect x="221" y="182" width="16" height="16" rx="6" fill="#f0b088" />
            <circle cx="200" cy="168" r="6.5" fill="#f3b48c" />
            <circle cx="229" cy="164" r="30" fill="url(#ss-skin)" />
            <path d="M199 168 C195 138 214 126 233 128 C255 130 263 148 259 168 C252 150 238 146 224 150 C214 153 206 160 199 168 Z" fill="url(#ss-hair)" />
            <path d="M210 140 C220 132 236 132 246 138" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="219" cy="168" rx="3.3" ry="4.2" fill="#1e1b4b" />
            <ellipse cx="240" cy="168" rx="3.3" ry="4.2" fill="#1e1b4b" />
            <circle cx="220.2" cy="166.6" r="1.2" fill="#ffffff" />
            <circle cx="241.2" cy="166.6" r="1.2" fill="#ffffff" />
            <circle cx="211" cy="178" r="5" fill="#ff8f8f" fillOpacity="0.4" />
            <circle cx="248" cy="178" r="5" fill="#ff8f8f" fillOpacity="0.4" />
            <path d="M221 180 Q229.5 188 238 180" fill="none" stroke="#9a4a3a" strokeWidth="2.4" strokeLinecap="round" />
          </g>

          {/* Руки к клавиатуре */}
          <path d="M207 208 Q188 230 192 250" fill="none" stroke="url(#ss-hoodie-blue)" strokeWidth="15" strokeLinecap="round" />
          <path d="M252 208 Q266 236 240 250" fill="none" stroke="url(#ss-hoodie-blue)" strokeWidth="15" strokeLinecap="round" />
          <circle cx="193" cy="252" r="7" fill="url(#ss-skin)" />
          <circle cx="238" cy="252" r="7" fill="url(#ss-skin)" />

          {/* Ноутбук: крышка повернута к ученику, видна задняя сторона со светящимся знаком */}
          <path d="M186 254 L244 254 L237 212 L193 212 Z" fill="url(#ss-laptop-lid)" />
          <circle cx="215" cy="232" r="7" fill="#7dd3fc" />
          <circle cx="215" cy="232" r="12" fill="#7dd3fc" fillOpacity="0.25" />
          <path d="M176 254 L254 254 L262 264 L168 264 Z" fill="url(#ss-laptop-base)" />
        </g>
      </g>

      {/* Ученица со звездой */}
      <g className={styles.gStudentStar}>
        <g className={styles.enter} style={{ animationDelay: "0.6s" }}>
          {/* Ноги и кроссовки */}
          <rect x="410" y="328" width="15" height="62" rx="7" fill="url(#ss-pants)" />
          <rect x="430" y="328" width="15" height="62" rx="7" fill="url(#ss-pants)" />
          <path d="M402 392 Q402 382 414 382 L426 382 Q432 384 432 394 L402 396 Z" fill="#ffffff" />
          <path d="M402 394 L432 394 L432 398 L402 398 Z" fill="#2f6bff" />
          <path d="M428 392 Q428 382 440 382 L452 382 Q458 384 458 394 L428 396 Z" fill="#ffffff" />
          <path d="M428 394 L458 394 L458 398 L428 398 Z" fill="#2f6bff" />

          {/* Худи */}
          <path d="M398 338 C394 300 400 276 418 266 L448 266 C466 276 472 300 466 338 Z" fill="url(#ss-hoodie-violet)" />
          <path d="M418 268 Q433 284 448 268" fill="none" stroke="#5631e0" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />

          {/* Опущенная рука */}
          <path d="M404 282 Q392 308 402 326" fill="none" stroke="url(#ss-hoodie-violet)" strokeWidth="15" strokeLinecap="round" />
          <circle cx="403" cy="328" r="7" fill="url(#ss-skin)" />

          {/* Поднятая рука к звезде */}
          <path d="M460 280 Q480 250 486 218" fill="none" stroke="url(#ss-hoodie-violet)" strokeWidth="15" strokeLinecap="round" />
          <circle cx="487" cy="212" r="7.5" fill="url(#ss-skin)" />

          {/* Голова */}
          <g className={styles.gHeadB}>
            <rect x="425" y="250" width="16" height="18" rx="6" fill="#f0b088" />
            <circle cx="452" cy="198" r="13" fill="url(#ss-hair)" />
            <circle cx="433" cy="234" r="28" fill="url(#ss-skin)" />
            <path d="M405 236 C402 208 420 196 438 198 C458 200 466 216 462 236 C456 222 446 214 432 216 C420 218 410 226 405 236 Z" fill="url(#ss-hair)" />
            <path d="M405 236 C403 250 406 262 412 268 C410 254 410 244 412 236 Z" fill="url(#ss-hair)" />
            <ellipse cx="425" cy="236" rx="3.2" ry="4.1" fill="#1e1b4b" />
            <ellipse cx="445" cy="235" rx="3.2" ry="4.1" fill="#1e1b4b" />
            <circle cx="426.4" cy="234.2" r="1.2" fill="#ffffff" />
            <circle cx="446.4" cy="233.2" r="1.2" fill="#ffffff" />
            <circle cx="418" cy="246" r="5" fill="#ff8f8f" fillOpacity="0.4" />
            <circle cx="453" cy="245" r="5" fill="#ff8f8f" fillOpacity="0.4" />
            <path d="M426 246 Q435 254 444 245" fill="none" stroke="#9a4a3a" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* Звезда в руке */}
      <g className={styles.gStar}>
        <g className={styles.enter} style={{ animationDelay: "0.85s" }}>
          <g className={styles.idleStar}>
            <circle cx="494" cy="180" r="38" fill="url(#ss-star-glow)" />
            <path
              d="M494 156 L501 172 L518 174 L505 185 L509 202 L494 193 L479 202 L483 185 L470 174 L487 172 Z"
              fill="url(#ss-gold)"
              stroke="#fff3c4"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </g>

      {/* Немного искр — без перегрузки сцены */}
      <g className={styles.gSparkles}>
        <path className={styles.twinkle} d="M118 150 L122 162 L134 166 L122 170 L118 182 L114 170 L102 166 L114 162 Z" fill="#c7d7ff" />
        <path className={styles.twinkle} style={{ animationDelay: "1.4s" }} d="M560 300 L563 309 L572 312 L563 315 L560 324 L557 315 L548 312 L557 309 Z" fill="#d9ccff" />
        <circle cx="168" cy="96" r="2.5" fill="#ffffff" fillOpacity="0.6" />
        <circle cx="586" cy="200" r="2" fill="#ffffff" fillOpacity="0.5" />
      </g>
    </svg>
  );
}
