"use client";

import "@/lib/rafShim";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStore } from "@/lib/store";
import { useSound } from "@/lib/useSound";
import Scene from "./canvas/Scene";
import Preloader from "./dom/Preloader";
import Cursor from "./dom/Cursor";
import Hud from "./dom/Hud";
import Sections from "./dom/Sections";

gsap.registerPlugin(ScrollTrigger);

/**
 * Оркестратор: lenis (инерционный скролл) + ScrollTrigger + прогресс в стор.
 * Скролл здесь — не прокрутка страницы, а таймлайн полёта камеры.
 */
export default function Experience() {
  const introDone = useStore((s) => s.introDone);
  useSound();

  // флаги среды — до первого кадра
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(pointer: coarse)").matches;
    useStore.getState().setFlags({ reducedMotion: mq.matches, isTouch: touch });
    const onChange = () => useStore.getState().setFlags({ reducedMotion: mq.matches });
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const { reducedMotion } = useStore.getState();

    const readProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      useStore.getState().setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    if (reducedMotion) {
      // статичная версия: нативный скролл без инерции
      window.addEventListener("scroll", readProgress, { passive: true });
      readProgress();
      return () => window.removeEventListener("scroll", readProgress);
    }

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on("scroll", () => {
      ScrollTrigger.update();
      readProgress();
    });
    // единый тикер: gsap ведёт и lenis, и ScrollTrigger — нет двойных rAF
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // скролл заблокирован, пока идёт прелоадер
  useEffect(() => {
    document.documentElement.classList.toggle("no-scroll", !introDone);
  }, [introDone]);

  // позиция мыши для параллакса сцены и планктона
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      useStore.getState().setMouse(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <Scene />
      <Sections />
      <Hud />
      <Cursor />
      <Preloader />
    </>
  );
}
