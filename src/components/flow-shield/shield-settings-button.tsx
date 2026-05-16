import { Settings2, X } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShieldSettingsButtonProps {
  active: boolean;
  onPress: () => void;
}

/**
 * 우측 상단에 떠 있는 설정 토글 버튼입니다.
 * 슬라이더 패널이 열려 있을 때는 닫기 아이콘으로 전환됩니다.
 */
export function ShieldSettingsButton({
  active,
  onPress,
}: ShieldSettingsButtonProps) {
  const insets = useSafeAreaInsets();
  const Icon = active ? X : Settings2;

  return (
    <Pressable
      accessibilityLabel={active ? "Hide shield controls" : "Show shield controls"}
      accessibilityRole="button"
      accessibilityState={{ expanded: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        position: "absolute",
        zIndex: 30,
        elevation: 30,
        top: Math.max(insets.top + 8, 16),
        right: 16,
        width: 46,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 23,
        backgroundColor: pressed
          ? "rgba(23, 42, 52, 0.92)"
          : "rgba(5, 10, 14, 0.78)",
        borderWidth: 1,
        borderColor: active
          ? "rgba(67, 220, 255, 0.58)"
          : "rgba(145, 226, 255, 0.18)",
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Icon pointerEvents="none" color="#e9f9ff" size={21} strokeWidth={2.2} />
    </Pressable>
  );
}
