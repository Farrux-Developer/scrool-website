"use client";

import { useEffect, useRef } from "react";
import { useStore } from "./store";

/**
 * Звук полностью синтезирован в WebAudio — ни одного аудиофайла.
 * Эмбиент: два расстроенных осциллятора + фильтрованный шум «толщи воды».
 * Глубина скролла закрывает фильтр — чем глубже, тем глуше мир.
 * UI-блипы вешаются делегированием на [data-sfx].
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodes = useRef<{ master: GainNode; filter: BiquadFilterNode } | null>(null);

  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      if (s.soundOn === prev.soundOn) return;

      if (s.soundOn) {
        if (!ctxRef.current) {
          const ctx = new AudioContext();
          ctxRef.current = ctx;

          const master = ctx.createGain();
          master.gain.value = 0;
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 400;
          filter.connect(master);
          master.connect(ctx.destination);

          // дрон: две почти совпадающие частоты дают медленное биение
          for (const f of [54, 54.6, 108.5]) {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = f;
            const g = ctx.createGain();
            g.gain.value = f > 100 ? 0.05 : 0.16;
            osc.connect(g).connect(filter);
            osc.start();
          }

          // шум воды: белый шум через узкий bandpass с медленным LFO
          const len = ctx.sampleRate * 2;
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buf;
          noise.loop = true;
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = 320;
          bp.Q.value = 0.7;
          const ng = ctx.createGain();
          ng.gain.value = 0.045;
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.07;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.02;
          lfo.connect(lfoGain).connect(ng.gain);
          noise.connect(bp).connect(ng).connect(filter);
          noise.start();
          lfo.start();

          nodes.current = { master, filter };
        }
        ctxRef.current.resume();
        nodes.current!.master.gain.linearRampToValueAtTime(0.5, ctxRef.current.currentTime + 1.2);
      } else if (ctxRef.current && nodes.current) {
        nodes.current.master.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.6);
      }
    });
  }, []);

  // глубина → тембр: фильтр закрывается при спуске
  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      if (s.progress === prev.progress || !ctxRef.current || !nodes.current) return;
      const f = 500 - s.progress * 360;
      nodes.current.filter.frequency.setTargetAtTime(f, ctxRef.current.currentTime, 0.4);
    });
  }, []);

  // блипы на hover интерактивных элементов
  useEffect(() => {
    const blip = () => {
      const ctx = ctxRef.current;
      if (!ctx || !useStore.getState().soundOn) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.09);
      g.gain.setValueAtTime(0.035, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.("[data-sfx]")) blip();
    };
    window.addEventListener("pointerover", onOver);
    return () => window.removeEventListener("pointerover", onOver);
  }, []);
}
