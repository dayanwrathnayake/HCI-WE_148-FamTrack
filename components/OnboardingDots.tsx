import { View } from "react-native";

import { colors } from "../constants/colors";

type OnboardingDotsProps = {
  total: number;
  activeIndex: number;
};

export function OnboardingDots({ total, activeIndex }: OnboardingDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className="h-1.5 rounded-full"
          style={{
            width: index === activeIndex ? 16 : 6,
            backgroundColor: index === activeIndex ? colors.primary : colors.dotInactive,
          }}
        />
      ))}
    </View>
  );
}
