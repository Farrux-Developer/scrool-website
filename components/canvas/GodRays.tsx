"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { sampleAtmosphere } from "@/lib/world";

/**
 * Солнечные столбы у поверхности: перевёрнутые открытые конусы
 * с аддитивным шейдером. Полосы света медленно вращаются и гаснут
 * с глубиной (uOpacity ведёт атмосфера).
 */

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    // вертикальный градиент: ярко сверху, растворяется книзу
    float grad = smoothstep(0.0, 0.85, vUv.y);
    // движущиеся полосы — имитация ряби на поверхности
    float bands = 0.6 + 0.4 * sin(vUv.x * 28.0 + uTime * 0.35 + vWorld.x * 0.2);
    bands *= 0.7 + 0.3 * sin(vUv.x * 9.0 - uTime * 0.2);
    // растворение по краям развёртки, чтобы конус не читался как меш
    float edge = sin(vUv.x * 3.14159);
    float a = grad * bands * edge * uOpacity * 0.16;
    gl_FragColor = vec4(vec3(0.75, 0.95, 0.9), a);
  }
`;

const CONES = [
  { pos: [-14, 26, -18], scale: [10, 90, 10], rot: 0.12 },
  { pos: [10, 24, -42], scale: [14, 110, 14], rot: -0.08 },
  { pos: [-4, 28, -70], scale: [9, 100, 9], rot: 0.05 },
  { pos: [22, 20, -12], scale: [12, 80, 12], rot: -0.15 },
  { pos: [2, 30, -30], scale: [7, 95, 7], rot: 0.02 },
] as const;

export default function GodRays() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const quality = useStore((s) => s.quality);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }),
    []
  );

  useFrame(({ clock }) => {
    if (!mat.current) return;
    const { progress, reducedMotion } = useStore.getState();
    const { a, b, f } = sampleAtmosphere(progress);
    mat.current.uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    mat.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(a.rays, b.rays, f);
    if (group.current) group.current.visible = mat.current.uniforms.uOpacity.value > 0.01;
  });

  if (quality === 0) return null;

  return (
    <group ref={group}>
      {CONES.map((c, i) => (
        <mesh key={i} position={c.pos as unknown as THREE.Vector3} rotation={[0, 0, c.rot]} scale={c.scale as unknown as THREE.Vector3}>
          <cylinderGeometry args={[0.25, 1, 1, 24, 1, true]} />
          <shaderMaterial
            ref={i === 0 ? mat : undefined}
            vertexShader={vertex}
            fragmentShader={fragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
