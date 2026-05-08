"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { useSatellite } from "@/hooks/use-satellite";
import { useWorldStore } from "@/state/worldStore";

// 4 shells: low / mid / high / cirrus — z heights in scene units
const SHELLS = [
  { z: 0.015, altLabel: "low", scaleY: 0.85, color: "#E8EEF8" },
  { z: 0.03, altLabel: "mid", scaleY: 0.95, color: "#EEF2FC" },
  { z: 0.05, altLabel: "high", scaleY: 1.05, color: "#F4F7FE" },
  { z: 0.07, altLabel: "cirrus", scaleY: 1.1, color: "#FAFBFF" },
];

const ASPECT = 1.98; // matches NepalMap aspect ratio

function CloudShell({
  z,
  scaleY,
  color,
  baseOpacity,
  idle,
}: {
  z: number;
  scaleY: number;
  color: string;
  baseOpacity: number;
  idle: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2); // random phase offset

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (!idle) {
      timeRef.current += delta * 0.15;
    }
    // Gentle drift on x and y
    ref.current.position.x = Math.sin(timeRef.current) * 0.03;
    ref.current.position.y = Math.cos(timeRef.current * 0.7) * 0.015;
  });

  return (
    <mesh ref={ref} position={[0, 0, z]}>
      <planeGeometry args={[ASPECT * 1.1, scaleY, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={baseOpacity} depthWrite={false} />
    </mesh>
  );
}

export function CloudShells() {
  const { manifest } = useSatellite();
  const { idle, performanceTier, activeLayer } = useWorldStore();

  if (activeLayer !== "clouds") return null;

  // Derive opacity from satellite cloud cover (full scope)
  const fullCover = manifest?.scopes?.full?.cloudCoverPct ?? 50;
  const baseOpacity = (fullCover / 100) * 0.22;

  // Tier-low: render only the single composite shell
  const shellsToRender = performanceTier === "low" ? SHELLS.slice(0, 1) : SHELLS;

  return (
    <>
      {shellsToRender.map((shell) => (
        <CloudShell
          key={shell.altLabel}
          z={shell.z}
          scaleY={shell.scaleY}
          color={shell.color}
          baseOpacity={baseOpacity * (shell.altLabel === "low" ? 1 : 0.7)}
          idle={idle}
        />
      ))}
    </>
  );
}
