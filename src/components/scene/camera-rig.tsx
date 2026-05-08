"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useWorldStore } from "@/state/worldStore";

const TOPDOWN = {
  position: new THREE.Vector3(0, 0, 5),
  target: new THREE.Vector3(0, 0, 0),
  zoom: 180,
};

const TILT = {
  position: new THREE.Vector3(0, -1.2, 2.5),
  target: new THREE.Vector3(0, 0.1, 0),
  zoom: 120,
};

export function CameraRig() {
  const { camera } = useThree();
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(0); // 0 = topdown, 1 = tilt

  useEffect(() => {
    const target = cameraMode === "tilt" ? 1 : 0;
    const startProgress = progressRef.current;
    const startTime = performance.now();
    const DURATION = 800; // ms

    function animate() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      // Ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      progressRef.current = startProgress + (target - startProgress) * ease;
      const p = progressRef.current;

      camera.position.lerpVectors(TOPDOWN.position, TILT.position, p);
      camera.lookAt(
        TOPDOWN.target.x + (TILT.target.x - TOPDOWN.target.x) * p,
        TOPDOWN.target.y + (TILT.target.y - TOPDOWN.target.y) * p,
        TOPDOWN.target.z + (TILT.target.z - TOPDOWN.target.z) * p,
      );
      if ("zoom" in camera) {
        (camera as THREE.OrthographicCamera).zoom = TOPDOWN.zoom + (TILT.zoom - TOPDOWN.zoom) * p;
        (camera as THREE.OrthographicCamera).updateProjectionMatrix();
      }

      if (Math.abs(progressRef.current - target) > 0.001) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [camera, cameraMode]);

  return null;
}
