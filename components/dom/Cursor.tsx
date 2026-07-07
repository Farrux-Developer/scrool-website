"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Кастомный курсор: точка следует мгновенно, кольцо — с инерцией.
 * Контекст задаётся атрибутом data-cursor на любом элементе:
 *   data-cursor="view" | "drag" | "link" — кольцо растёт и показывает подпись.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const isTouch = useStore((s) => s.isTouch);
  const reducedMotion = useStore((s) => s.reducedMotion);

  useEffect(() => {
    if (isTouch) return;
    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const ctx = (e.target as Element | null)?.closest?.("[data-cursor]");
      const kind = ctx?.getAttribute("data-cursor") ?? "";
      targetScale = kind ? 2.6 : 1;
      setLabel(kind === "view" ? "СМОТРЕТЬ" : kind === "drag" ? "ТЯНИ" : "");
      document.body.classList.toggle("cursor-active", !!kind);
    };

    const tick = () => {
      // инерция кольца: классический lerp с коэффициентом кадра
      const k = reducedMotion ? 1 : 0.16;
      ringPos.x += (pos.x - ringPos.x) * k;
      ringPos.y += (pos.y - ringPos.y) * k;
      scale += (targetScale - scale) * 0.14;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [isTouch, reducedMotion]);

  if (isTouch) return null;

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span className="cursor-label">{label}</span>
      </div>
    </>
  );
}
