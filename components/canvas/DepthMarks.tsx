"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { cameraCurve } from "@/lib/world";

/**
 * Типографика, живущая внутри сцены: гигантские отметки глубины
 * стоят вдоль пути и тонут в тумане по мере приближения/удаления.
 * Ориентируем каждую поперёк направления полёта в её точке.
 */

const MARKS = [
  { t: 0.16, label: "−40", size: 10 },
  { t: 0.28, label: "ГЛУБИНА", size: 14 },
  { t: 0.4, label: "−800", size: 12 },
  { t: 0.58, label: "−3200", size: 13 },
  { t: 0.78, label: "−6400", size: 12 },
  { t: 0.875, label: "АБИСС", size: 16 },
];

export default function DepthMarks() {
  const items = useMemo(() => {
    const p = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    return MARKS.map((m) => {
      cameraCurve.getPointAt(m.t, p);
      cameraCurve.getTangentAt(m.t, tangent);
      // отметка стоит в стороне от пути и смотрит навстречу камере
      const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const offset = m.t * 7 % 2 < 1 ? 1 : -1;
      const pos = p.clone()
        .addScaledVector(side, offset * (14 + m.size))
        .addScaledVector(tangent, 30)
        .add(new THREE.Vector3(0, -4, 0));
      const rotY = Math.atan2(-tangent.x, -tangent.z) + Math.PI;
      return { ...m, pos, rotY };
    });
  }, []);

  return (
    <>
      {items.map((m) => (
        <Text
          key={m.label}
          font="/fonts/unbounded-700.ttf"
          position={m.pos}
          rotation={[0, m.rotY, 0]}
          fontSize={m.size}
          letterSpacing={0.06}
          color="#9fc9c2"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.32}
        >
          {m.label}
        </Text>
      ))}
    </>
  );
}
