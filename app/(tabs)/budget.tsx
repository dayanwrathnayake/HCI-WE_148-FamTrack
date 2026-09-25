import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";

// Placeholder — the full Budget tab belongs to another team member's module.
export default function BudgetPlaceholder() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-[16px] font-semibold" style={{ color: colors.textDark }}>
        Budget — coming soon
      </Text>
    </SafeAreaView>
  );
}
