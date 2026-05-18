import Slider from "@react-native-community/slider";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONTROL_PANEL_MAX_HEIGHT_RATIO = 0.3;

interface ShieldControlsProps {
  fresnel: {
    power: number;
    strength: number;
    onPowerChange: (value: number) => void;
    onStrengthChange: (value: number) => void;
  };
  hex: {
    scale: number;
    opacity: number;
    edgeWidth: number;
    flashSpeed: number;
    flashIntensity: number;
    onScaleChange: (value: number) => void;
    onOpacityChange: (value: number) => void;
    onEdgeWidthChange: (value: number) => void;
    onFlashSpeedChange: (value: number) => void;
    onFlashIntensityChange: (value: number) => void;
  };
}

/**
 * 모바일에서 엄지로 조작하기 쉬운 하단 실드 컨트롤 패널입니다.
 * Fresnel rim과 hex grid의 주요 파라미터를 슬라이더로 조절합니다.
 */
export function ShieldControls({
  fresnel,
  hex,
}: ShieldControlsProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const panelMaxHeight = height * CONTROL_PANEL_MAX_HEIGHT_RATIO;

  return (
    <View
      style={{
        position: "absolute",
        zIndex: 20,
        elevation: 20,
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
        padding: 16,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: "rgba(5, 10, 14, 0.86)",
        borderWidth: 1,
        borderColor: "rgba(145, 226, 255, 0.18)",
        maxHeight: panelMaxHeight,
      }}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator
        contentContainerStyle={{ gap: 14, paddingBottom: 2 }}
      >
        <ControlSlider
          label="Rim Sharpness"
          minimumLabel="Soft"
          maximumLabel="Sharp"
          value={fresnel.power}
          minimumValue={0.5}
          maximumValue={5}
          step={0.05}
          onValueChange={fresnel.onPowerChange}
        />
        <ControlSlider
          label="Rim Intensity"
          minimumLabel="Dim"
          maximumLabel="Bright"
          value={fresnel.strength}
          minimumValue={0}
          maximumValue={3}
          step={0.05}
          onValueChange={fresnel.onStrengthChange}
        />
        <ControlSlider
          label="Grid Scale"
          minimumLabel="Sparse"
          maximumLabel="Dense"
          value={hex.scale}
          minimumValue={1}
          maximumValue={20}
          step={0.5}
          onValueChange={hex.onScaleChange}
        />
        <ControlSlider
          label="Grid Opacity"
          minimumLabel="Hidden"
          maximumLabel="Bright"
          value={hex.opacity}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={hex.onOpacityChange}
        />
        <ControlSlider
          label="Grid Line Width"
          minimumLabel="Thin"
          maximumLabel="Wide"
          value={hex.edgeWidth}
          minimumValue={0.01}
          maximumValue={0.2}
          step={0.005}
          onValueChange={hex.onEdgeWidthChange}
        />
        <ControlSlider
          label="Grid Flicker Speed"
          minimumLabel="Slow"
          maximumLabel="Fast"
          value={hex.flashSpeed}
          minimumValue={0.5}
          maximumValue={8}
          step={0.1}
          onValueChange={hex.onFlashSpeedChange}
        />
        <ControlSlider
          label="Grid Flicker Intensity"
          minimumLabel="Calm"
          maximumLabel="Bright"
          value={hex.flashIntensity}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={hex.onFlashIntensityChange}
        />
      </ScrollView>
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
        <Text
          selectable
          style={{ color: "#e9f9ff", fontSize: 14, fontWeight: "700" }}
        >
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
