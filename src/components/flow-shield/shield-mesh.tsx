import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import { createShieldMaterial } from "./shield-material";
import type {
  DissolveParams,
  FlowParams,
  FresnelParams,
  HexParams,
} from "./shield-params";

export interface ShieldControlsRef {
  fresnel: FresnelParams;
  hex: HexParams;
  flow: FlowParams;
  dissolve: DissolveParams;
}

export interface ShieldRevealAnimationRef {
  active: boolean;
  startedAt: number | null;
  duration: number;
}

interface ShieldMeshProps {
  controlsRef: React.RefObject<ShieldControlsRef>;
  revealAnimationRef: React.RefObject<ShieldRevealAnimationRef>;
  onRevealAnimationComplete: () => void;
}

/**
 * Three.js geometry/material 추상화로 실드 sphere를 선언합니다.
 * 현재는 Fresnel rim, procedural hex grid, flow noise, dissolve reveal 레이어를 표현합니다.
 */
export function ShieldMesh({
  controlsRef,
  revealAnimationRef,
  onRevealAnimationComplete,
}: ShieldMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const shieldMaterial = useMemo(() => createShieldMaterial(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const controls = controlsRef.current;
    const elapsedSeconds = clock.elapsedTime;
    const revealAnimation = revealAnimationRef.current;

    if (revealAnimation.active) {
      revealAnimation.startedAt ??= elapsedSeconds;

      const progress = Math.min(
        (elapsedSeconds - revealAnimation.startedAt) / revealAnimation.duration,
        1,
      );
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      controls.dissolve.progress = easedProgress;

      if (progress >= 1) {
        revealAnimation.active = false;
        revealAnimation.startedAt = null;
        controls.dissolve.progress = 1;
        onRevealAnimationComplete();
      }
    }

    shieldMaterial.uniforms.time.value = elapsedSeconds;
    shieldMaterial.uniforms.fresnelPower.value = controls.fresnel.power;
    shieldMaterial.uniforms.fresnelStrength.value = controls.fresnel.strength;
    shieldMaterial.uniforms.hexScale.value = controls.hex.scale;
    shieldMaterial.uniforms.hexOpacity.value = controls.hex.opacity;
    shieldMaterial.uniforms.hexEdgeWidth.value = controls.hex.edgeWidth;
    shieldMaterial.uniforms.hexFlashSpeed.value = controls.hex.flashSpeed;
    shieldMaterial.uniforms.hexFlashIntensity.value =
      controls.hex.flashIntensity;
    shieldMaterial.uniforms.flowScale.value = controls.flow.scale;
    shieldMaterial.uniforms.flowSpeed.value = controls.flow.speed;
    shieldMaterial.uniforms.flowIntensity.value = controls.flow.intensity;
    shieldMaterial.uniforms.dissolveProgress.value =
      controls.dissolve.progress;
    shieldMaterial.uniforms.dissolveNoiseScale.value =
      controls.dissolve.noiseScale;
    shieldMaterial.uniforms.dissolveEdgeWidth.value =
      controls.dissolve.edgeWidth;
    shieldMaterial.uniforms.dissolveEdgeIntensity.value =
      controls.dissolve.edgeIntensity;
    shieldMaterial.uniforms.dissolveEdgeSmoothness.value =
      controls.dissolve.edgeSmoothness;

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
