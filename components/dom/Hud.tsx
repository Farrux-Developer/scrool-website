"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { CHAPTERS, depthAt } from "@/lib/world";

/**
 * HUD погружения: живой глубиномер, номер главы, вертикальный прогресс
 * и «виньетка давления», сжимающая кадр в средних главах.
 */
export default function Hud() {
  const depth = useRef<HTMLSpanElement>(null);
  const chapter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const vignette = useRef<HTMLDivElement>(null);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);
  const introDone = useStore((s) => s.introDone);

  useEffect(() => {
    // подписка мимо React-рендера: HUD обновляется на каждый тик скролла
    return useStore.subscribe((s, prev) => {
      if (s.progress === prev.progress) return;
      const t = s.progress;
      if (depth.current) {
        const d = depthAt(t);
        depth.current.textContent = `−${String(d).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} М`;
      }
      if (chapter.current) {
        let i = 0;
        for (let k = 0; k < CHAPTERS.length; k++) if (t >= CHAPTERS[k].t) i = k;
        chapter.current.textContent = `0${i + 1} — ${CHAPTERS[i].name}`;
      }
      if (bar.current) bar.current.style.transform = `scaleY(${t})`;
      if (vignette.current) {
        // давление максимально в абиссе (t≈0.75), отпускает при всплытии
        const p = Math.sin(Math.min(t / 0.78, 1) * Math.PI * 0.5) * (1 - Math.max(0, (t - 0.86) / 0.14));
        vignette.current.style.opacity = String(0.25 + p * 0.55);
      }
    });
  }, []);

  return (
    <>
      <div ref={vignette} className="pressure-vignette" aria-hidden />
      <div className={`hud ${introDone ? "hud-visible" : ""}`}>
        <div className="hud-depth">
          <span className="hud-caption">ГЛУБИНА</span>
          <span ref={depth} className="hud-depth-value">−0 М</span>
        </div>
        <span ref={chapter} className="hud-chapter">01 — ПОВЕРХНОСТЬ</span>
        <div className="hud-progress" aria-hidden>
          <div ref={bar} className="hud-progress-fill" />
        </div>
        <button
          className="hud-sound"
          data-cursor="link"
          onClick={toggleSound}
          aria-label={soundOn ? "Выключить звук" : "Включить звук"}
        >
          <span className={`hud-sound-waves ${soundOn ? "on" : ""}`}>
            <i /><i /><i /><i />
          </span>
          {soundOn ? "ЗВУК ВКЛ" : "ЗВУК ВЫКЛ"}
        </button>
      </div>
    </>
  );
}
