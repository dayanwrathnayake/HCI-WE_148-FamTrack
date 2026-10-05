import {
  ActivityIndicator,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../constants/colors";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Shows a spinner instead of the label and blocks presses. */
  loading?: boolean;
};

export function PrimaryButton({ label, onPress, style, disabled, loading }: PrimaryButtonProps) {
  const inactive = Boolean(disabled || loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      className="h-[52px] w-full items-center justify-center rounded-[22px]"
      style={[{ backgroundColor: colors.primary, opacity: inactive ? 0.6 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text className="text-[16px] font-semibold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
