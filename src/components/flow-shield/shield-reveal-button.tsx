import { RefreshCw } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShieldRevealButtonProps {
  onPress: () => void;
}

/**
 * 우측 상단 설정 버튼 옆에서 dissolve reveal 애니메이션을 다시 재생합니다.
 * 실드가 사라진 상태에서 다시 생성되는 흐름을 빠르게 확인할 때 사용합니다.
 */
export function ShieldRevealButton({ onPress }: ShieldRevealButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityLabel="Replay shield reveal"
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
      <RefreshCw
        pointerEvents="none"
        color="#e9f9ff"
        size={21}
        strokeWidth={2.2}
      />
    </Pressable>
  );
}
