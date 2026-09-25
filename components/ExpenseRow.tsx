import { Text, View, type ImageSourcePropType } from "react-native";

import { Icon } from "./Icon";
import { MemberAvatar } from "./MemberAvatar";
import { colors } from "../constants/colors";
import type { IconName } from "../constants/icons";

type ExpenseRowProps = {
  icon: IconName;
  iconBackground: string;
  name: string;
  amount: string;
  avatars: ImageSourcePropType[];
  showDivider?: boolean;
};

export function ExpenseRow({
  icon,
  iconBackground,
  name,
  amount,
  avatars,
  showDivider = true,
}: ExpenseRowProps) {
  return (
    <View
      className="w-full flex-row items-center justify-between py-3"
      style={showDivider ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBackground }}
        >
          <Icon name={icon} size={18} />
        </View>
        <View className="gap-0.5">
          <Text className="text-[15px] font-medium" style={{ color: colors.textDark }}>
            {name}
          </Text>
          <View className="flex-row items-center">
            {avatars.map((source, index) => (
              <MemberAvatar key={index} source={source} overlap={index > 0} />
            ))}
          </View>
        </View>
      </View>
      <Text className="text-[16px] font-bold" style={{ color: colors.textDark }}>
        {amount}
      </Text>
    </View>
  );
}
