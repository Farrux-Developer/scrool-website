"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { cameraCurve } from "@/lib/world";

/**
 * Планктон / морской снег: одна геометрия Points = один draw call.
 * Частицы рассыпаны трубой вокруг всей траектории камеры.
 * Взаимодействие с курсором сделано в clip space: точка, чья проекция
 * близка к курсору, отталкивается от него — дёшево и убедительно.
 */

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;        // NDC курсора
  uniform float uPixelRatio;
  uniform float uRepel;       // сила огибания курсора
  attribute float aScale;
  attribute float aPhase;
  attribute float aHue;       // 0 — снег, 1 — биолюминесцентная особь
  varying float vTwinkle;
  varying float vHue;
  varying float vFogDepth;

  void main() {
    vec3 p = position;
    // медленный дрейф: псевдотечение из смещённых синусоид
    p.x += sin(uTime * 0.18 + aPhase * 6.28) * 1.6;
    p.y += sin(uTime * 0.12 + aPhase * 12.0) * 1.1 - uTime * 0.12 * aScale;
    p.z += cos(uTime * 0.15 + aPhase * 9.0) * 1.4;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // огибание курсора: отталкивание в экранной плоскости с мягким спадом
    vec2 ndc = clip.xy / clip.w;
    vec2 away = ndc - uMouse;
    float d = length(away);
    float push = smoothstep(0.45, 0.0, d) * uRepel;
    clip.xy += normalize(away + 1e-4) * push * clip.w * 0.09;

    gl_Position = clip;
    gl_PointSize = aScale * uPixelRatio * (140.0 / -mv.z);
    gl_PointSize = min(gl_PointSize, 22.0 * uPixelRatio);

    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 2.0) + aPhase * 40.0);
    vHue = aHue;
    vFogDepth = -mv.z;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorSnow;
  uniform vec3 uColorGlow;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying float vTwinkle;
  varying float vHue;
  varying float vFogDepth;

  void main() {
    // мягкий диск с ядром
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.12, d);
    float core = smoothstep(0.18, 0.0, d);

    vec3 col = mix(uColorSnow, uColorGlow, vHue);
    float alpha = disc * mix(0.35, 1.0, vHue) * vTwinkle + core * 0.5;

    // ручной exp2-туман, т.к. ShaderMaterial не подключает сценовый
    float fogF = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
    col = mix(col, uFogColor, fogF);
    alpha *= 1.0 - fogF * 0.9;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

/** mulberry32 — детерминированный PRNG: чистая генерация частиц в рендере. */
function mulberry32(seedInit: number) {
  let seed = seedInit;
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Plankton() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const isTouch = useStore((s) => s.isTouch);
  const quality = useStore((s) => s.quality);
  const count = isTouch ? 2200 : quality > 1 ? 6500 : 3500;

  const { positions, scales, phases, hues } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const hues = new Float32Array(count);
    const p = new THREE.Vector3();
    const rand = mulberry32(0x9e3779b9);

    for (let i = 0; i < count; i++) {
      const t = rand();
      cameraCurve.getPointAt(t, p);
      // труба радиусом до 45 вокруг пути, разреженная в центре, чтобы не лезть в камеру
      const r = 6 + Math.pow(rand(), 0.6) * 42;
      const ang = rand() * Math.PI * 2;
      positions[i * 3] = p.x + Math.cos(ang) * r;
      positions[i * 3 + 1] = p.y + (rand() - 0.5) * 46;
      positions[i * 3 + 2] = p.z + Math.sin(ang) * r;
      scales[i] = 0.6 + rand() * 1.8;
      phases[i] = rand();
      // биолюминесцентные особи концентрируются в средней трети погружения
      const glowZone = t > 0.42 && t < 0.75;
      hues[i] = glowZone && rand() < 0.28 ? 1 : 0;
      if (hues[i] > 0.5) scales[i] *= 1.7;
    }
    return { positions, scales, phases, hues };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(10, 10) },
      uPixelRatio: { value: 1 },
      uRepel: { value: 1 },
      uColorSnow: { value: new THREE.Color("#bfe3dc") },
      uColorGlow: { value: new THREE.Color("#7af8d6") },
      uFogColor: { value: new THREE.Color("#11606e") },
      uFogDensity: { value: 0.011 },
    }),
    []
  );

  useFrame(({ clock, gl, scene }) => {
    if (!mat.current) return;
    const { mouse, reducedMotion, isTouch } = useStore.getState();
    const u = mat.current.uniforms;
    u.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uRepel.value = isTouch || reducedMotion ? 0 : 1;
    u.uMouse.value.set(mouse.x, mouse.y);
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      u.uFogColor.value.copy(fog.color);
      u.uFogDensity.value = fog.density;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aHue" args={[hues, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
