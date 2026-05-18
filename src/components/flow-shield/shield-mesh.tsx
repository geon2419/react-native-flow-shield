import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import { createShieldMaterial } from "./shield-material";
import type { FresnelParams, HexParams } from "./shield-params";

export interface ShieldControlsRef {
  fresnel: FresnelParams;
  hex: HexParams;
}

interface ShieldMeshProps {
  controlsRef: React.RefObject<ShieldControlsRef>;
}

/**
 * Three.js geometry/material 추상화로 실드 sphere를 선언합니다.
 * 현재는 레퍼런스의 Fresnel rim과 procedural hex grid 레이어를 표현합니다.
 */
export function ShieldMesh({ controlsRef }: ShieldMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const shieldMaterial = useMemo(() => createShieldMaterial(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const controls = controlsRef.current;
    const elapsedSeconds = clock.elapsedTime;
    shieldMaterial.uniforms.time.value = elapsedSeconds;
    shieldMaterial.uniforms.fresnelPower.value = controls.fresnel.power;
    shieldMaterial.uniforms.fresnelStrength.value = controls.fresnel.strength;
    shieldMaterial.uniforms.hexScale.value = controls.hex.scale;
    shieldMaterial.uniforms.hexOpacity.value = controls.hex.opacity;
    shieldMaterial.uniforms.hexEdgeWidth.value = controls.hex.edgeWidth;
    shieldMaterial.uniforms.hexFlashSpeed.value = controls.hex.flashSpeed;
    shieldMaterial.uniforms.hexFlashIntensity.value =
      controls.hex.flashIntensity;

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
