import React, { Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Constants from "expo-constants";

// Keep WebGPU imports behind the Expo Go guard. Expo Go does not include
// react-native-wgpu's native module.
const FlowShield = React.lazy(() => import("@/components/flow-shield"));

export default function Page() {
  if (Constants.appOwnership === "expo") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          gap: 12,
          padding: 24,
          backgroundColor: "#0b1014",
        }}
      >
        <Text selectable style={{ color: "#e7f7ff", fontSize: 22, fontWeight: "700" }}>
          Custom dev build required
        </Text>
        <Text selectable style={{ color: "#9fb3c0", fontSize: 15, lineHeight: 22 }}>
          React Native WebGPU is not included in Expo Go. Run this project with
          `npm run ios` or `npm run android` to build a native client that
          contains WebGPUModule.
        </Text>
      </View>
    );
  }

  return (
    <Suspense fallback={<ActivityIndicator animating />}>
      <FlowShield />
    </Suspense>
  );
}
