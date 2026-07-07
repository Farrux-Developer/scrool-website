"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useStore } from "@/lib/store";
import CameraRig from "./CameraRig";
import Atmosphere from "./Atmosphere";
import Plankton from "./Plankton";
import GodRays from "./GodRays";
import Rocks from "./Rocks";
import Monument from "./Monument";
import DepthMarks from "./DepthMarks";

/** Сигнал «первый кадр отрисован» — прелоадер ждёт его, а не таймер. */
function Ready() {
  const setReady = useStore((s) => s.setReady);
  useEffect(() => setReady(), [setReady]);
  return null;
}

export default function Scene() {
  const setQuality = useStore((s) => s.setQuality);
  const [dpr, setDpr] = useState(1.5);

  return (
    <div className="scene-canvas" aria-hidden>
      <Canvas
        dpr={dpr}
        camera={{ fov: 60, near: 0.1, far: 320, position: [0, -2, 8] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        shadows
        onCreated={(state) => {
          if (process.env.NODE_ENV === "development") {
            (window as unknown as Record<string, unknown>).__r3f = state;
          }
        }}
      >
        <PerformanceMonitor
          onIncline={() => {
            setDpr(Math.min(1.75, window.devicePixelRatio));
            setQuality(2);
          }}
          onDecline={() => {
            setDpr(1);
            setQuality((q => Math.max(0, q - 1))(useStore.getState().quality));
          }}
        >
          <CameraRig />
          <Atmosphere />
          <Suspense fallback={null}>
            <GodRays />
            <Plankton />
            <Rocks />
            <Monument />
            <DepthMarks />
            <Ready />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
