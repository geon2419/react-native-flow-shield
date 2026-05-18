import { useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { FiberCanvas } from "@/lib/fiber-canvas";

import { ShieldControls } from "./shield-controls";
import { ShieldMesh, type ShieldControlsRef } from "./shield-mesh";
import { SHIELD_PARAMS } from "./shield-params";
import { ShieldSettingsButton } from "./shield-settings-button";

/**
 * Flow Shield 효과를 화면에 배치하는 React Native 래퍼 컴포넌트입니다.
 * 현재는 어두운 배경 위에 R3F WebGPU Canvas를 전체 화면으로 올립니다.
 */
export default function FlowShield() {
  const controlsRef = useRef<ShieldControlsRef>({
    fresnel: { ...SHIELD_PARAMS.fresnel },
    hex: { ...SHIELD_PARAMS.hex },
    flow: { ...SHIELD_PARAMS.flow },
  });
  const [controlsVisible, setControlsVisible] = useState(false);
  const [fresnel, setFresnel] = useState(SHIELD_PARAMS.fresnel);
  const [hex, setHex] = useState(SHIELD_PARAMS.hex);
  const [flow, setFlow] = useState(SHIELD_PARAMS.flow);
  const scene = useMemo(
    () => (
      <>
        <color attach="background" args={["#05080c"]} />
        <ambientLight intensity={0.8} />
        <ShieldMesh controlsRef={controlsRef} />
      </>
    ),
    [],
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

  return (
    <View style={{ flex: 1, backgroundColor: "#05080c" }}>
      <FiberCanvas style={{ flex: 1 }}>{scene}</FiberCanvas>
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
        />
      ) : null}
    </View>
  );
}
