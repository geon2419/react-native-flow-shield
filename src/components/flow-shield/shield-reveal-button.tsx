import { Eye, EyeOff } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShieldRevealButtonProps {
  revealed: boolean;
  onPress: () => void;
}

/**
 * 우측 상단 설정 버튼 옆에서 dissolve reveal 상태를 토글합니다.
 * 실드가 보이면 사라지고, 사라진 상태라면 다시 생성되는 흐름을 확인합니다.
 */
export function ShieldRevealButton({
  revealed,
  onPress,
}: ShieldRevealButtonProps) {
  const insets = useSafeAreaInsets();
  const Icon = revealed ? Eye : EyeOff;

  return (
    <Pressable
      accessibilityLabel={revealed ? "Shield is visible" : "Shield is hidden"}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        position: "absolute",
        zIndex: 30,
        elevation: 30,
        top: Math.max(insets.top + 8, 16),
        right: 72,
        width: 46,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 23,
        backgroundColor: pressed
          ? "rgba(23, 42, 52, 0.92)"
          : "rgba(5, 10, 14, 0.78)",
        borderWidth: 1,
        borderColor: "rgba(145, 226, 255, 0.18)",
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Icon
        pointerEvents="none"
        color="#e9f9ff"
        size={21}
        strokeWidth={2.2}
      />
    </Pressable>
  );
}
