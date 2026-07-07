"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { MONUMENT_POS } from "@/lib/world";

/**
 * Финальный артефакт: гиробаскет из трёх латунных колец
 * вокруг светящегося ядра на каменном постаменте.
 * Ядро — кастомный френель-шейдер: мята по кромке, янтарь в центре.
 */

const coreVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const coreFragment = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 2.0);
    float breath = 0.85 + 0.15 * sin(uTime * 1.4);
    vec3 amber = vec3(0.91, 0.64, 0.36);
    vec3 mint  = vec3(0.48, 0.97, 0.84);
    vec3 col = mix(amber * 0.9, mint, fresnel);
    gl_FragColor = vec4(col * breath * uPulse, 1.0);
  }
`;

/** Радиальная текстура для глоу-спрайта: рисуем один раз на canvas. */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(232, 162, 92, 0.9)");
  g.addColorStop(0.35, "rgba(232, 162, 92, 0.28)");
  g.addColorStop(1, "rgba(232, 162, 92, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export default function Monument() {
  const rings = useRef<THREE.Group>(null);
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const glow = useRef<THREE.Sprite>(null);
  const glowTexture = useMemo(() => makeGlowTexture(), []);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPulse: { value: 1 } }), []);

  useFrame(({ clock }, delta) => {
    const { progress, mouse, reducedMotion } = useStore.getState();
    const t = clock.elapsedTime;
    if (coreMat.current) {
      coreMat.current.uniforms.uTime.value = reducedMotion ? 0 : t;
      // ядро разгорается при подходе камеры
      coreMat.current.uniforms.uPulse.value = 0.6 + THREE.MathUtils.smoothstep(progress, 0.7, 0.88) * 1.8;
    }
    if (glow.current) {
      // «маяк в бездне»: тёплое пятно, зовущее сквозь чёрную воду,
      // дышит и разгорается по мере приближения
      const near = THREE.MathUtils.smoothstep(progress, 0.6, 0.85);
      const breath = reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(t * 1.1);
      (glow.current.material as THREE.SpriteMaterial).opacity = near * breath * 0.85;
      const s = 14 + near * 8;
      glow.current.scale.set(s, s, 1);
    }
    if (rings.current && !reducedMotion) {
      const [a, b, c] = rings.current.children;
      a.rotation.x += delta * 0.25;
      a.rotation.y += delta * 0.11;
      b.rotation.y -= delta * 0.19;
      b.rotation.z += delta * 0.07;
      c.rotation.z -= delta * 0.13;
      c.rotation.x += delta * 0.09;
      // артефакт едва заметно поворачивается за курсором
      rings.current.rotation.y = THREE.MathUtils.damp(rings.current.rotation.y, mouse.x * 0.35, 2, delta);
      rings.current.rotation.x = THREE.MathUtils.damp(rings.current.rotation.x, -mouse.y * 0.25, 2, delta);
    }
  });

  return (
    <group position={MONUMENT_POS}>
      {/* постамент */}
      <mesh position={[0, -7.5, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 7.5, 9, 6]} />
        <meshStandardMaterial color="#16333d" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, -2.6, 0]}>
        <cylinderGeometry args={[2.4, 3.4, 1.2, 6]} />
        <meshStandardMaterial color="#1d444f" roughness={0.65} metalness={0.3} flatShading />
      </mesh>

      <group ref={rings} position={[0, 2.6, 0]}>
        {[3.4, 2.6, 1.9].map((r, i) => (
          <mesh key={i} castShadow>
            <torusGeometry args={[r, 0.14 + i * 0.03, 24, 96]} />
            {/* металл не 1.0: без env-карты чистому металлу нечего отражать */}
            <meshStandardMaterial color="#e8a25c" metalness={0.85} roughness={0.35} />
          </mesh>
        ))}
        {/* ядро */}
        <mesh>
          <icosahedronGeometry args={[1.4, 3]} />
          <shaderMaterial ref={coreMat} vertexShader={coreVertex} fragmentShader={coreFragment} uniforms={uniforms} />
        </mesh>
        <sprite ref={glow}>
          <spriteMaterial
            map={glowTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0}
          />
        </sprite>
      </group>
    </group>
  );
}
