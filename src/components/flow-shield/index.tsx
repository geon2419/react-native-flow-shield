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
    fresnelPower: SHIELD_PARAMS.fresnelPower,
    fresnelStrength: SHIELD_PARAMS.fresnelStrength,
  });
  const [controlsVisible, setControlsVisible] = useState(false);
  const [fresnelPower, setFresnelPower] = useState(SHIELD_PARAMS.fresnelPower);
  const [fresnelStrength, setFresnelStrength] = useState(
    SHIELD_PARAMS.fresnelStrength,
  );
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
    controlsRef.current.fresnelPower = value;
    setFresnelPower(value);
  };

  const handleFresnelStrengthChange = (value: number) => {
    controlsRef.current.fresnelStrength = value;
    setFresnelStrength(value);
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
          fresnelPower={fresnelPower}
          fresnelStrength={fresnelStrength}
          onFresnelPowerChange={handleFresnelPowerChange}
          onFresnelStrengthChange={handleFresnelStrengthChange}
        />
      ) : null}
    </View>
  );
}
