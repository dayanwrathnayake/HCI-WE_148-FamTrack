import { Text, View } from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { useAuth } from "../context/AuthContext";
import { useFamily } from "../context/FamilyContext";
import { getAvatarPalette, getInitials } from "../utils/members";

export function GroupAdminCard() {
  const { profile, user } = useAuth();
  const { members, currentMember } = useFamily();

  const adminMember = members.find((m) => m.role === "admin") || currentMember;

  const adminName =
    adminMember?.displayName ||
    profile?.name ||
    user?.displayName ||
    "Family Admin";
  const adminEmail =
    adminMember?.inviteEmail ||
    profile?.email ||
    user?.email ||
    "admin@famtrack.app";
  const adminId = adminMember?.id || user?.uid || "admin_0";

  const palette = getAvatarPalette(adminId);
  const initials = getInitials(adminName);

  return (
    <View
      className="bg-white rounded-[22px] p-4 flex-row items-center gap-3.5 shadow-sm shadow-black/5"
      style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
    >
      <View className="p-0.5 rounded-full border-2 border-[#10b981]">
        <MemberInitialsAvatar
          initials={initials}
          backgroundColor={palette.background}
          textColor={palette.text}
          size={48}
        />
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text
            className="text-[16px] font-bold text-[#111827] shrink"
            numberOfLines={1}
          >
            {adminName}
          </Text>
          <View className="bg-[#e8f8f0] px-2 py-0.5 rounded-full">
            <Text className="text-[9.5px] font-extrabold text-[#00854b] tracking-wider">
              FAMILY ADMIN
            </Text>
          </View>
        </View>
        <Text className="text-[12px] text-[#64748b] mt-0.5" numberOfLines={1}>
          {adminEmail}
        </Text>
      </View>
    </View>
  );
}
