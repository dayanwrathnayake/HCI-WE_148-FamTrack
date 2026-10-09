import { Pressable, Text } from "react-native";

import { Icon } from "./Icon";
import { colors } from "../constants/colors";
import type { IconName } from "../constants/icons";

type SocialButtonProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
};

export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-[22px] bg-white"
      style={{ borderWidth: 1, borderColor: colors.textFaint }}
    >
      <Icon name={icon} size={22} />
      <Text className="text-[14px] text-black">{label}</Text>
    </Pressable>
  );
}
