import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import { createShieldMaterial } from "./shield-material";

export interface ShieldControlsRef {
  fresnelPower: number;
  fresnelStrength: number;
}

interface ShieldMeshProps {
  controlsRef: React.RefObject<ShieldControlsRef>;
}

/**
 * Three.js geometry/material 추상화로 실드 sphere를 선언합니다.
 * 현재는 레퍼런스의 첫 시각 레이어인 Fresnel rim sphere를 표현합니다.
 */
export function ShieldMesh({ controlsRef }: ShieldMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const shieldMaterial = useMemo(() => createShieldMaterial(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const controls = controlsRef.current;
    shieldMaterial.uniforms.fresnelPower.value = controls.fresnelPower;
    shieldMaterial.uniforms.fresnelStrength.value = controls.fresnelStrength;

    const elapsedSeconds = clock.elapsedTime;
    const scale = 1.0 + Math.sin(elapsedSeconds * 2.2) * 0.02;
    mesh.rotation.y = elapsedSeconds * 0.16;
    mesh.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} material={shieldMaterial.material}>
      <sphereGeometry args={[1.35, 64, 64]} />
    </mesh>
  );
}
