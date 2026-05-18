import { useCallback, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { FiberCanvas } from "@/lib/fiber-canvas";

import { ShieldControls } from "./shield-controls";
import {
  ShieldMesh,
  type ShieldControlsRef,
  type ShieldRevealAnimationRef,
} from "./shield-mesh";
import { SHIELD_PARAMS } from "./shield-params";
import { ShieldRevealButton } from "./shield-reveal-button";
import { ShieldSettingsButton } from "./shield-settings-button";

const REVEAL_ANIMATION_DURATION_SECONDS = 1.45;

/**
 * Flow Shield 효과를 화면에 배치하는 React Native 래퍼 컴포넌트입니다.
 * 현재는 어두운 배경 위에 R3F WebGPU Canvas를 전체 화면으로 올립니다.
 */
export default function FlowShield() {
  const controlsRef = useRef<ShieldControlsRef>({
    fresnel: { ...SHIELD_PARAMS.fresnel },
    hex: { ...SHIELD_PARAMS.hex },
    flow: { ...SHIELD_PARAMS.flow },
    dissolve: { ...SHIELD_PARAMS.dissolve },
  });
  const revealAnimationRef = useRef<ShieldRevealAnimationRef>({
    active: false,
    startedAt: null,
    duration: REVEAL_ANIMATION_DURATION_SECONDS,
    fromProgress: SHIELD_PARAMS.dissolve.progress,
    toProgress: SHIELD_PARAMS.dissolve.progress,
  });
  const [controlsVisible, setControlsVisible] = useState(false);
  const [fresnel, setFresnel] = useState(SHIELD_PARAMS.fresnel);
  const [hex, setHex] = useState(SHIELD_PARAMS.hex);
  const [flow, setFlow] = useState(SHIELD_PARAMS.flow);
  const [dissolve, setDissolve] = useState(SHIELD_PARAMS.dissolve);

  const handleRevealAnimationComplete = useCallback((progress: number) => {
    setDissolve((current) => ({ ...current, progress }));
  }, []);

  const scene = useMemo(
    () => (
      <>
        <color attach="background" args={["#05080c"]} />
        <ambientLight intensity={0.8} />
        <ShieldMesh
          controlsRef={controlsRef}
          revealAnimationRef={revealAnimationRef}
          onRevealAnimationComplete={handleRevealAnimationComplete}
        />
      </>
    ),
    [handleRevealAnimationComplete],
  );

  const handleFresnelPowerChange = (value: number) => {
    controlsRef.current.fresnel.power = value;
    setFresnel((current) => ({ ...current, power: value }));
  };

  const handleFresnelStrengthChange = (value: number) => {
    controlsRef.current.fresnel.strength = value;
    setFresnel((current) => ({ ...current, strength: value }));
  };

  const handleHexScaleChange = (value: number) => {
    controlsRef.current.hex.scale = value;
    setHex((current) => ({ ...current, scale: value }));
  };

  const handleHexOpacityChange = (value: number) => {
    controlsRef.current.hex.opacity = value;
    setHex((current) => ({ ...current, opacity: value }));
  };

  const handleHexEdgeWidthChange = (value: number) => {
    controlsRef.current.hex.edgeWidth = value;
    setHex((current) => ({ ...current, edgeWidth: value }));
  };

  const handleHexFlashSpeedChange = (value: number) => {
    controlsRef.current.hex.flashSpeed = value;
    setHex((current) => ({ ...current, flashSpeed: value }));
  };

  const handleHexFlashIntensityChange = (value: number) => {
    controlsRef.current.hex.flashIntensity = value;
    setHex((current) => ({ ...current, flashIntensity: value }));
  };

  const handleFlowScaleChange = (value: number) => {
    controlsRef.current.flow.scale = value;
    setFlow((current) => ({ ...current, scale: value }));
  };

  const handleFlowSpeedChange = (value: number) => {
    controlsRef.current.flow.speed = value;
    setFlow((current) => ({ ...current, speed: value }));
  };

  const handleFlowIntensityChange = (value: number) => {
    controlsRef.current.flow.intensity = value;
    setFlow((current) => ({ ...current, intensity: value }));
  };

  const handleDissolveProgressChange = (value: number) => {
    controlsRef.current.dissolve.progress = value;
    setDissolve((current) => ({ ...current, progress: value }));
  };

  const handleDissolveNoiseScaleChange = (value: number) => {
    controlsRef.current.dissolve.noiseScale = value;
    setDissolve((current) => ({ ...current, noiseScale: value }));
  };

  const handleDissolveEdgeWidthChange = (value: number) => {
    controlsRef.current.dissolve.edgeWidth = value;
    setDissolve((current) => ({ ...current, edgeWidth: value }));
  };

  const handleDissolveEdgeIntensityChange = (value: number) => {
    controlsRef.current.dissolve.edgeIntensity = value;
    setDissolve((current) => ({ ...current, edgeIntensity: value }));
  };

  const handleDissolveEdgeSmoothnessChange = (value: number) => {
    controlsRef.current.dissolve.edgeSmoothness = value;
    setDissolve((current) => ({ ...current, edgeSmoothness: value }));
  };

  const handleRevealToggle = () => {
    const fromProgress = controlsRef.current.dissolve.progress;
    const toProgress = fromProgress >= 0.5 ? 0 : 1;

    revealAnimationRef.current.active = true;
    revealAnimationRef.current.startedAt = null;
    revealAnimationRef.current.duration = REVEAL_ANIMATION_DURATION_SECONDS;
    revealAnimationRef.current.fromProgress = fromProgress;
    revealAnimationRef.current.toProgress = toProgress;
    setDissolve((current) => ({ ...current, progress: toProgress }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#05080c" }}>
      <FiberCanvas style={{ flex: 1 }}>{scene}</FiberCanvas>
      <ShieldRevealButton
        revealed={dissolve.progress >= 0.5}
        onPress={handleRevealToggle}
      />
      <ShieldSettingsButton
        active={controlsVisible}
        onPress={() => setControlsVisible((visible) => !visible)}
      />
      {controlsVisible ? (
        <ShieldControls
          fresnel={{
            ...fresnel,
            onPowerChange: handleFresnelPowerChange,
            onStrengthChange: handleFresnelStrengthChange,
          }}
          hex={{
            ...hex,
            onScaleChange: handleHexScaleChange,
            onOpacityChange: handleHexOpacityChange,
            onEdgeWidthChange: handleHexEdgeWidthChange,
            onFlashSpeedChange: handleHexFlashSpeedChange,
            onFlashIntensityChange: handleHexFlashIntensityChange,
          }}
          flow={{
            ...flow,
            onScaleChange: handleFlowScaleChange,
            onSpeedChange: handleFlowSpeedChange,
            onIntensityChange: handleFlowIntensityChange,
          }}
          dissolve={{
            ...dissolve,
            onProgressChange: handleDissolveProgressChange,
            onNoiseScaleChange: handleDissolveNoiseScaleChange,
            onEdgeWidthChange: handleDissolveEdgeWidthChange,
            onEdgeIntensityChange: handleDissolveEdgeIntensityChange,
            onEdgeSmoothnessChange: handleDissolveEdgeSmoothnessChange,
          }}
        />
      ) : null}
    </View>
  );
}
