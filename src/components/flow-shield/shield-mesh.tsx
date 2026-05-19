import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import { createShieldMaterial } from "./shield-material";
import { MAX_HITS } from "./shield-params";
import type {
  DissolveParams,
  FlowParams,
  FresnelParams,
  HitParams,
  HexParams,
} from "./shield-params";

export interface ShieldControlsRef {
  fresnel: FresnelParams;
  hex: HexParams;
  flow: FlowParams;
  dissolve: DissolveParams;
  hit: HitParams;
}

export interface ShieldHitRef {
  position: THREE.Vector3;
  sequence: number;
}

export interface ShieldRevealAnimationRef {
  active: boolean;
  startedAt: number | null;
  duration: number;
  fromProgress: number;
  toProgress: number;
}

interface ShieldMeshProps {
  controlsRef: React.RefObject<ShieldControlsRef>;
  hitRef: React.RefObject<ShieldHitRef>;
  revealAnimationRef: React.RefObject<ShieldRevealAnimationRef>;
  onSceneReady: (mesh: THREE.Mesh, camera: THREE.Camera) => void;
  onRevealAnimationComplete: (progress: number) => void;
}

/**
 * Three.js geometry/material 추상화로 실드 sphere를 선언합니다.
 * 현재는 Fresnel rim, procedural hex grid, flow noise, dissolve reveal 레이어를 표현합니다.
 */
export function ShieldMesh({
  controlsRef,
  hitRef,
  revealAnimationRef,
  onSceneReady,
  onRevealAnimationComplete,
}: ShieldMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastHitSequenceRef = useRef(hitRef.current.sequence);
  const nextHitSlotRef = useRef(0);

  const shieldMaterial = useMemo(() => createShieldMaterial(), []);

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const controls = controlsRef.current;
    const hit = hitRef.current;
    const elapsedSeconds = clock.elapsedTime;
    const revealAnimation = revealAnimationRef.current;

    onSceneReady(mesh, camera);

    if (revealAnimation.active) {
      revealAnimation.startedAt ??= elapsedSeconds;

      const progress = Math.min(
        (elapsedSeconds - revealAnimation.startedAt) / revealAnimation.duration,
        1,
      );
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      controls.dissolve.progress =
        revealAnimation.fromProgress +
        (revealAnimation.toProgress - revealAnimation.fromProgress) *
          easedProgress;

      if (progress >= 1) {
        revealAnimation.active = false;
        revealAnimation.startedAt = null;
        controls.dissolve.progress = revealAnimation.toProgress;
        onRevealAnimationComplete(revealAnimation.toProgress);
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
    shieldMaterial.uniforms.hitRingSpeed.value = controls.hit.ringSpeed;
    shieldMaterial.uniforms.hitRingWidth.value = controls.hit.ringWidth;
    shieldMaterial.uniforms.hitMaxRadius.value = controls.hit.maxRadius;
    shieldMaterial.uniforms.hitDuration.value = controls.hit.duration;
    shieldMaterial.uniforms.hitIntensity.value = controls.hit.intensity;
    shieldMaterial.uniforms.hitImpactRadius.value = controls.hit.impactRadius;

    if (lastHitSequenceRef.current !== hit.sequence) {
      const hitSlot = nextHitSlotRef.current % MAX_HITS;
      shieldMaterial.uniforms.hitPositions[hitSlot].value.copy(hit.position);
      shieldMaterial.uniforms.hitTimes[hitSlot].value = elapsedSeconds;
      nextHitSlotRef.current += 1;
      lastHitSequenceRef.current = hit.sequence;
    }

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
