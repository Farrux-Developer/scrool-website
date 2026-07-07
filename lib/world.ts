import * as THREE from "three";

/**
 * Мир NADIR: одна непрерывная сцена-погружение.
 * Ось Y — глубина (вниз), камера летит вдоль -Z по кривой.
 * Все зоны и атмосфера привязаны к параметру t (0..1) той же кривой,
 * что и прогресс скролла — единый источник правды.
 */

export const PALETTE = {
  ink: "#020b12",
  petrol: "#0e5e6f",
  mint: "#7af8d6",
  amber: "#e8a25c",
  bone: "#e8f1ef",
} as const;

/** Траектория камеры: спуск с ленивыми S-образными виражами, в конце — подъём к свету. */
export const cameraCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, -2, 8),
    new THREE.Vector3(9, -22, -55),
    new THREE.Vector3(-13, -58, -125),
    new THREE.Vector3(11, -108, -205),
    new THREE.Vector3(-8, -158, -285),
    new THREE.Vector3(2, -206, -360),
    new THREE.Vector3(0, -218, -412),
    new THREE.Vector3(0, -196, -455),
  ],
  false,
  "catmullrom",
  0.5
);

/** Позиция монумента с продуктом — сбоку от финального участка пути:
 *  камера проходит мимо в ~10-20 юнитах, не задевая кольца. */
export const MONUMENT_POS = new THREE.Vector3(-10, -220, -428);

export interface AtmosphereKey {
  t: number;
  fog: string;
  fogDensity: number;
  ambient: string;
  ambientIntensity: number;
  key: string; // цвет ключевого направленного света
  keyIntensity: number;
  rays: number; // непрозрачность световых столбов у поверхности
  depth: number; // показания глубиномера, м
}

/** Атмосферные ключи глав. Между ними всё интерполируется — швов нет. */
export const ATMOSPHERE: AtmosphereKey[] = [
  { t: 0.0,  fog: "#11606e", fogDensity: 0.011, ambient: "#3f8d97", ambientIntensity: 1.1, key: "#bfe8e2", keyIntensity: 2.4, rays: 1.0, depth: 0 },
  { t: 0.13, fog: "#0c4c5c", fogDensity: 0.013, ambient: "#2f7482", ambientIntensity: 0.9, key: "#a8d8d2", keyIntensity: 1.8, rays: 0.7, depth: 40 },
  { t: 0.32, fog: "#083544", fogDensity: 0.016, ambient: "#1f5866", ambientIntensity: 0.7, key: "#7fb5b4", keyIntensity: 1.1, rays: 0.15, depth: 800 },
  { t: 0.52, fog: "#041a29", fogDensity: 0.018, ambient: "#123c4d", ambientIntensity: 0.55, key: "#3d8d86", keyIntensity: 0.5, rays: 0.0, depth: 3200 },
  { t: 0.72, fog: "#02090f", fogDensity: 0.014, ambient: "#0a2230", ambientIntensity: 0.4, key: "#1f4a50", keyIntensity: 0.25, rays: 0.0, depth: 6400 },
  { t: 0.86, fog: "#02070c", fogDensity: 0.010, ambient: "#0a1e2b", ambientIntensity: 0.35, key: "#e8a25c", keyIntensity: 0.3, rays: 0.0, depth: 7500 },
  { t: 1.0,  fog: "#0a3947", fogDensity: 0.009, ambient: "#1e5a66", ambientIntensity: 0.8, key: "#cfe9e3", keyIntensity: 1.6, rays: 0.4, depth: 7500 },
];

/** Интерполяция атмосферы по t. Цвета — через THREE.Color, числа — линейно. */
export function sampleAtmosphere(t: number) {
  const keys = ATMOSPHERE;
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const f = THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1);
  // smoothstep, чтобы переходы дышали, а не щёлкали
  const s = f * f * (3 - 2 * f);
  return { a, b, f: s };
}

/** Главы для HUD: индекс, имя, диапазон прогресса. */
export const CHAPTERS = [
  { t: 0.0,  name: "ПОВЕРХНОСТЬ" },
  { t: 0.13, name: "ПОГРУЖЕНИЕ" },
  { t: 0.32, name: "ТОЛЩА" },
  { t: 0.52, name: "СВЕЧЕНИЕ" },
  { t: 0.72, name: "АБИСС" },
  { t: 0.9,  name: "ВСПЛЫТИЕ" },
];

export function depthAt(t: number): number {
  const { a, b, f } = sampleAtmosphere(t);
  return Math.round(THREE.MathUtils.lerp(a.depth, b.depth, f));
}
