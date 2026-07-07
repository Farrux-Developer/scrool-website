"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { sampleAtmosphere, MONUMENT_POS } from "@/lib/world";

const _cA = new THREE.Color();
const _cB = new THREE.Color();

// единственный экземпляр атмосферы на приложение — держим вне React,
// чтобы свободно мутировать в кадровом цикле
const FOG = new THREE.FogExp2("#11606e", 0.011);
const BG = new THREE.Color("#11606e");
const SPOT_TARGET = new THREE.Object3D();
SPOT_TARGET.position.copy(MONUMENT_POS);

/**
 * Туман, фон и свет — единый градиент всего погружения.
 * Каждый кадр интерполируем между атмосферными ключами глав.
 */
export default function Atmosphere() {
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const amberSpot = useRef<THREE.SpotLight>(null);

  useFrame(({ camera }) => {
    const t = useStore.getState().progress;
    const { a, b, f } = sampleAtmosphere(t);

    FOG.color.lerpColors(_cA.set(a.fog), _cB.set(b.fog), f);
    FOG.density = THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, f);
    BG.copy(FOG.color);

    if (ambient.current) {
      ambient.current.color.lerpColors(_cA.set(a.ambient), _cB.set(b.ambient), f);
      ambient.current.intensity = THREE.MathUtils.lerp(a.ambientIntensity, b.ambientIntensity, f);
    }
    if (key.current) {
      key.current.color.lerpColors(_cA.set(a.key), _cB.set(b.key), f);
      key.current.intensity = THREE.MathUtils.lerp(a.keyIntensity, b.keyIntensity, f);
      // ключевой свет всегда «сверху», едет вместе с камерой
      key.current.position.set(camera.position.x + 20, camera.position.y + 80, camera.position.z - 30);
      key.current.target.position.set(camera.position.x, camera.position.y, camera.position.z - 60);
      key.current.target.updateMatrixWorld();
    }
    if (amberSpot.current) {
      // прожектор монумента разгорается только в абиссе
      amberSpot.current.intensity = THREE.MathUtils.smoothstep(t, 0.72, 0.86) * 3600;
    }
  });

  return (
    <>
      {/* туман и фон подключаются к сцене декларативно, мутируются по кадрам */}
      <primitive object={FOG} attach="fog" />
      <primitive object={BG} attach="background" />
      <ambientLight ref={ambient} intensity={1} />
      <directionalLight ref={key} intensity={2} />
      <primitive object={SPOT_TARGET} />
      <spotLight
        ref={amberSpot}
        position={[MONUMENT_POS.x + 6, MONUMENT_POS.y + 26, MONUMENT_POS.z + 14]}
        target={SPOT_TARGET}
        angle={0.6}
        penumbra={0.85}
        decay={1.6}
        color="#e8a25c"
        intensity={0}
      />
      {/* холодная подсветка монумента снизу — мятный контровик */}
      <pointLight
        position={[MONUMENT_POS.x - 8, MONUMENT_POS.y - 2, MONUMENT_POS.z - 6]}
        color="#7af8d6"
        intensity={160}
        decay={1.7}
      />
    </>
  );
}
