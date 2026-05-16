import Slider from "@react-native-community/slider";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShieldControlsProps {
  fresnelPower: number;
  fresnelStrength: number;
  onFresnelPowerChange: (value: number) => void;
  onFresnelStrengthChange: (value: number) => void;
}

/**
 * 모바일에서 엄지로 조작하기 쉬운 하단 Fresnel 컨트롤 패널입니다.
 * rim의 날카로움과 밝기를 각각 슬라이더로 조절합니다.
 */
export function ShieldControls({
  fresnelPower,
  fresnelStrength,
  onFresnelPowerChange,
  onFresnelStrengthChange,
}: ShieldControlsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        zIndex: 20,
        elevation: 20,
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
        gap: 14,
        padding: 16,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: "rgba(5, 10, 14, 0.86)",
        borderWidth: 1,
        borderColor: "rgba(145, 226, 255, 0.18)",
      }}
    >
      <ControlSlider
        label="Rim Sharpness"
        minimumLabel="Soft"
        maximumLabel="Sharp"
        value={fresnelPower}
        minimumValue={0.5}
        maximumValue={5}
        step={0.05}
        onValueChange={onFresnelPowerChange}
      />
      <ControlSlider
        label="Rim Intensity"
        minimumLabel="Dim"
        maximumLabel="Bright"
        value={fresnelStrength}
        minimumValue={0}
        maximumValue={3}
        step={0.05}
        onValueChange={onFresnelStrengthChange}
      />
    </View>
  );
}

interface ControlSliderProps {
  label: string;
  minimumLabel: string;
  maximumLabel: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
}

function ControlSlider({
  label,
  minimumLabel,
  maximumLabel,
  value,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
}: ControlSliderProps) {
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text selectable style={{ color: "#e9f9ff", fontSize: 14, fontWeight: "700" }}>
          {label}
        </Text>
        <Text
          selectable
          style={{
            minWidth: 40,
            color: "#8fdfff",
            fontSize: 13,
            fontVariant: ["tabular-nums"],
            textAlign: "right",
          }}
        >
          {value.toFixed(2)}
        </Text>
      </View>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor="#43dcff"
        maximumTrackTintColor="rgba(143, 223, 255, 0.24)"
        thumbTintColor="#e9f9ff"
        onValueChange={onValueChange}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text selectable style={{ color: "#77909c", fontSize: 11 }}>
          {minimumLabel}
        </Text>
        <Text selectable style={{ color: "#77909c", fontSize: 11 }}>
          {maximumLabel}
        </Text>
      </View>
    </View>
  );
}
