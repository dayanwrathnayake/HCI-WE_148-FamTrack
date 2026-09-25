import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../constants/colors";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[52px] w-full items-center justify-center rounded-[22px]"
      style={[{ backgroundColor: colors.primary }, style]}
    >
      <Text className="text-[16px] font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
