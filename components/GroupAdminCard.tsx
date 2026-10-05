import { Image, Text, View } from "react-native";
import { INITIAL_ADMIN } from "../constants/group";

export function GroupAdminCard() {
  return (
    <View
      className="bg-white rounded-[22px] p-4 flex-row items-center gap-3.5 shadow-sm shadow-black/5"
      style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
    >
      <View className="p-0.5 rounded-full border-2 border-[#10b981]">
        <Image
          source={INITIAL_ADMIN.avatar}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          resizeMode="cover"
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[16px] font-bold text-[#111827]">
            {INITIAL_ADMIN.name}
          </Text>
          <View className="bg-[#e8f8f0] px-2 py-0.5 rounded-full">
            <Text className="text-[9.5px] font-extrabold text-[#00854b] tracking-wider">
              {INITIAL_ADMIN.role}
            </Text>
          </View>
        </View>
        <Text className="text-[12px] text-[#64748b] mt-0.5">
          {INITIAL_ADMIN.email}
        </Text>
      </View>
    </View>
  );
}
