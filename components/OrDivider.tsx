import { Text, View } from "react-native";

import { colors } from "../constants/colors";

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-[1px] flex-1" style={{ backgroundColor: colors.dotInactive }} />
      <Text className="text-[12px]" style={{ color: "#58585a" }}>
        Or continue with
      </Text>
      <View className="h-[1px] flex-1" style={{ backgroundColor: colors.dotInactive }} />
    </View>
  );
}
