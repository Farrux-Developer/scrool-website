"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraCurve, MONUMENT_POS } from "@/lib/world";

/**
 * Рельеф: один InstancedMesh скал (1 draw call).
 * Верхняя половина пути — редкие «висящие» глыбы,
 * нижняя — дно и каньон, обрамляющий подход к монументу.
 */
export default function Rocks() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const COUNT = 170;

  // икосаэдр с запечённым шумом вершин — одна геометрия на все инстансы
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n =
        Math.sin(v.x * 3.1 + 1.7) * Math.sin(v.y * 2.7 + 4.2) * Math.sin(v.z * 3.7 + 2.1);
      v.multiplyScalar(1 + n * 0.35);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    const p = new THREE.Vector3();
    let i = 0;

    const place = (
      t: number,
      radiusMin: number,
      radiusMax: number,
      yOff: number,
      scale: [number, number]
    ) => {
      cameraCurve.getPointAt(t, p);
      const ang = Math.random() * Math.PI * 2;
      const r = radiusMin + Math.random() * (radiusMax - radiusMin);
      dummy.position.set(
        p.x + Math.cos(ang) * r,
        p.y + yOff + (Math.random() - 0.5) * 14,
        p.z + Math.sin(ang) * r
      );
      const s = scale[0] + Math.random() * (scale[1] - scale[0]);
      dummy.scale.set(s * (0.6 + Math.random() * 0.9), s, s * (0.6 + Math.random() * 0.9));
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i++, dummy.matrix);
    };

    // редкие глыбы в толще (t 0.25..0.6)
    for (let k = 0; k < 40; k++) place(0.25 + Math.random() * 0.35, 26, 60, 0, [2, 6]);
    // каньон в абиссе: стены слева и справа от пути (t 0.62..0.88)
    for (let k = 0; k < 80; k++) {
      const t = 0.62 + Math.random() * 0.26;
      cameraCurve.getPointAt(t, p);
      const side = Math.random() < 0.5 ? -1 : 1;
      dummy.position.set(
        p.x + side * (16 + Math.random() * 18),
        p.y - 6 + Math.random() * 26,
        p.z + (Math.random() - 0.5) * 30
      );
      const s = 5 + Math.random() * 12;
      dummy.scale.set(s, s * (1 + Math.random()), s);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i++, dummy.matrix);
    }
    // дно вокруг монумента
    const remaining = COUNT - i;
    for (let k = 0; k < remaining; k++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * 70;
      dummy.position.set(
        MONUMENT_POS.x + Math.cos(ang) * r,
        MONUMENT_POS.y - 8 - Math.random() * 6,
        MONUMENT_POS.z + Math.sin(ang) * r
      );
      const s = 2 + Math.random() * 9;
      dummy.scale.set(s * 1.4, s * 0.6, s * 1.4);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.rotation.x = (Math.random() - 0.5) * 0.4;
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i++, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, COUNT]} frustumCulled={false}>
      <meshStandardMaterial color="#132831" roughness={0.95} metalness={0.05} flatShading />
    </instancedMesh>
  );
}
