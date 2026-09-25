import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";

// Placeholder — Savings Goals belongs to another team member's module.
export default function SavingsPlaceholder() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-[16px] font-semibold" style={{ color: colors.textDark }}>
        Savings — coming soon
      </Text>
    </SafeAreaView>
  );
}
