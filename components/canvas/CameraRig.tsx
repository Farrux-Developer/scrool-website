"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { cameraCurve, MONUMENT_POS } from "@/lib/world";

const _pos = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _look = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();

/**
 * Камера летит вдоль cameraCurve по прогрессу скролла.
 * Всё через damp — прямых присваиваний нет, поэтому движение
 * инерционное даже при резком скролле.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const smoothT = useRef(0);
  const lookTarget = useRef(new THREE.Vector3(0, -2, -20));
  const mouseS = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const { progress, mouse, reducedMotion, introDone } = useStore.getState();

    // до конца прелоадера камера стоит в начале пути
    const target = introDone ? progress : 0;
    smoothT.current = reducedMotion
      ? target
      : THREE.MathUtils.damp(smoothT.current, target, 2.2, delta);
    const t = THREE.MathUtils.clamp(smoothT.current, 0, 1);

    cameraCurve.getPointAt(t, _pos);
    cameraCurve.getPointAt(Math.min(t + 0.02, 1), _ahead);

    // фокус на монументе в финале; на самом всплытии взгляд отпускает
    // артефакт и поднимается к свету по касательной пути
    const focus =
      THREE.MathUtils.smoothstep(t, 0.82, 0.9) *
      (1 - THREE.MathUtils.smoothstep(t, 0.94, 0.995));
    _look.copy(_ahead).lerp(MONUMENT_POS, focus * 0.9);

    // параллакс мыши: сдвиг в локальном базисе камеры
    const k = reducedMotion ? 0 : 1;
    mouseS.current.x = THREE.MathUtils.damp(mouseS.current.x, mouse.x * k, 3, delta);
    mouseS.current.y = THREE.MathUtils.damp(mouseS.current.y, mouse.y * k, 3, delta);

    _fwd.copy(_look).sub(_pos).normalize();
    _right.crossVectors(_fwd, _up).normalize();

    _pos.addScaledVector(_right, mouseS.current.x * 1.4);
    _pos.addScaledVector(_up, mouseS.current.y * -0.9);

    camera.position.copy(_pos);
    lookTarget.current.lerp(_look, reducedMotion ? 1 : Math.min(1, delta * 4));
    // взгляд тоже слегка уводится за курсором
    camera.lookAt(
      lookTarget.current.x + mouseS.current.x * 3,
      lookTarget.current.y - mouseS.current.y * 2,
      lookTarget.current.z
    );
  });

  return null;
}
