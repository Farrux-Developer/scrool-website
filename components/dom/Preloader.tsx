"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useStore } from "@/lib/store";

/**
 * Прелоадер-«иллюминатор»: счётчик глубинометра тикает до 100,
 * затем сцена раскрывается расширяющимся кругом. Никаких спиннеров.
 * Ждём реальной готовности: первый кадр WebGL + шрифты.
 */
export default function Preloader() {
  const overlay = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const ready = useStore((s) => s.ready);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setIntroDone = useStore((s) => s.setIntroDone);

  useEffect(() => {
    if (reducedMotion) {
      // статичная версия: без театра, сразу в сцену
      if (!ready) return;
      const id = requestAnimationFrame(() => {
        setIntroDone();
        setGone(true);
      });
      return () => cancelAnimationFrame(id);
    }

    const state = { v: 0 };
    let revealed = false;

    const reveal = () => {
      if (revealed || !overlay.current) return;
      revealed = true;
      gsap.timeline({
        onComplete: () => {
          setIntroDone();
          setGone(true);
        },
      })
        .to(counter.current, { yPercent: -120, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(overlay.current, {
          clipPath: "circle(0% at 50% 50%)",
          duration: 1.4,
          ease: "power3.inOut",
        }, "-=0.1");
    };

    // счётчик идёт к 90 сам, до 100 — только когда сцена реально готова
    const tween = gsap.to(state, {
      v: 90,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => {
        if (counter.current) counter.current.textContent = String(Math.round(state.v)).padStart(3, "0");
        if (line.current) line.current.style.transform = `scaleX(${state.v / 100})`;
      },
    });

    if (ready) {
      tween.kill();
      gsap.to(state, {
        v: 100,
        duration: 0.6,
        ease: "power1.inOut",
        onUpdate: () => {
          if (counter.current) counter.current.textContent = String(Math.round(state.v)).padStart(3, "0");
          if (line.current) line.current.style.transform = `scaleX(${state.v / 100})`;
        },
        onComplete: reveal,
      });
    }

    return () => {
      tween.kill();
    };
  }, [ready, reducedMotion, setIntroDone]);

  if (gone) return null;

  return (
    <div ref={overlay} className="preloader" style={{ clipPath: "circle(150% at 50% 50%)" }}>
      <div className="preloader-inner">
        <span className="preloader-brand">NADIR</span>
        <div ref={counter} className="preloader-counter">000</div>
        <span className="preloader-unit">АТМ</span>
        <div className="preloader-line"><div ref={line} className="preloader-line-fill" /></div>
      </div>
    </div>
  );
}
