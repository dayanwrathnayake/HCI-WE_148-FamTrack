import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";

// Placeholder — Settings/profile belongs to another team member's module.
export default function SettingsPlaceholder() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-[16px] font-semibold" style={{ color: colors.textDark }}>
        Settings — coming soon
      </Text>
    </SafeAreaView>
  );
}
