import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { EditMemberModal } from "../components/EditMemberModal";
import { GroupAdminCard } from "../components/GroupAdminCard";
import { Icon } from "../components/Icon";
import { InviteMemberModal } from "../components/InviteMemberModal";
import { MemberControlRow } from "../components/MemberControlRow";
import { ShareInviteModal } from "../components/ShareInviteModal";
import {
  GroupMemberControl,
  INITIAL_ADMIN,
  INITIAL_GROUP_MEMBERS,
} from "../constants/group";

export default function ManageGroupScreen() {
  const [members, setMembers] = useState<GroupMemberControl[]>(
    INITIAL_GROUP_MEMBERS,
  );

  const [autoSync, setAutoSync] = useState(true);
  const [inviteViaQr, setInviteViaQr] = useState(true);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMemberControl | null>(
    null,
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleInviteMember = (data: {
    name: string;
    role: string;
    email: string;
    isFullAccess: boolean;
  }) => {
    const avatarList = [
      require("../assets/onboarding/avatar2.png"),
      require("../assets/onboarding/avatar3.png"),
      require("../assets/onboarding/avatar4.png"),
    ];

    const added: GroupMemberControl = {
      id: `mem_${Date.now()}`,
      name: data.name.trim(),
      roleDescription: data.role.trim() || "Member",
      accessType: data.isFullAccess ? "FULL ACCESS" : "LIMITED",
      limitText: data.isFullAccess ? undefined : "LIMIT: RS 15,000/MO",
      spentPercentage: 0.1,
      avatar: avatarList[members.length % avatarList.length],
      email:
        data.email.trim() ||
        `${data.name.trim().toLowerCase().replace(/\s+/g, "")}@gmail.com`,
    };

    setMembers((prev) => [...prev, added]);
    setIsInviteModalVisible(false);
    Alert.alert("Success", `${added.name} has been invited to the group!`);
  };

  const handleUpdateMember = (updated: GroupMemberControl) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    Alert.alert("Updated", `${updated.name}'s settings have been updated.`);
  };

  const handleRemoveMember = (id: string) => {
    const target = members.find((m) => m.id === id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (target) {
      Alert.alert(
        "Removed",
        `${target.name} was removed from the family group.`,
      );
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Family Group",
      "Are you sure you want to delete this family group? All shared budgets and member permissions will be reset.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Group",
          style: "destructive",
          onPress: () => {
            setMembers([]);
            Alert.alert("Group Deleted", "Family group has been removed.", [
              { text: "OK", onPress: () => handleBack() },
            ]);
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            className="h-[34px] w-[34px] rounded-full items-center justify-center bg-[#0e1116]"
          >
            <Icon name="arrowLeft" size={16} />
          </Pressable>

          <Text className="text-[20px] font-bold text-[#111827]">
            Manage Group
          </Text>

          <View className="w-[34px]" />
        </View>

        <ScrollView
          className="flex-1 bg-[#f8fafc]"
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <GroupAdminCard />

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#111827]">
                Family Members ({members.length + 1})
              </Text>

              <Pressable
                onPress={() => setIsInviteModalVisible(true)}
                hitSlop={6}
              >
                <Text className="text-[13px] font-bold text-[#05bf78]">
                  + Invite
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
              className="py-1"
            >
              <View className="items-center gap-1.5">
                <Image
                  source={INITIAL_ADMIN.avatar}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  resizeMode="cover"
                />
                <Text className="text-[12px] font-semibold text-[#111827]">
                  Kamal
                </Text>
              </View>

              {members.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setEditingMember(m)}
                  className="items-center gap-1.5 active:opacity-80"
                >
                  <Image
                    source={m.avatar}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    resizeMode="cover"
                  />
                  <Text className="text-[12px] font-semibold text-[#111827]">
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View className="gap-2.5">
            <Text className="text-[14px] font-bold text-[#111827]">
              Member Control & Allowances
            </Text>

            {members.length === 0 ? (
              <View className="bg-white rounded-[20px] p-6 items-center">
                <Text className="text-[13px] text-gray-400">
                  No family members added yet. Tap &quot;+ Invite&quot; above.
                </Text>
              </View>
            ) : (
              <View
                className="bg-white rounded-[22px] p-4 shadow-sm shadow-black/5 elevation-1 gap-4"
                style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
              >
                {members.map((m, index) => (
                  <MemberControlRow
                    key={m.id}
                    member={m}
                    isLast={index === members.length - 1}
                    onPress={() => setEditingMember(m)}
                  />
                ))}
              </View>
            )}
          </View>

          <View className="gap-2.5">
            <Text className="text-[14px] font-bold text-[#111827]">
              Group Settings
            </Text>

            <View
              className="bg-white rounded-[22px] p-4 shadow-sm shadow-black/5 elevation-1 gap-3.5"
              style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 mr-2">
                  <Text className="text-[17px]">🔄</Text>
                  <Text className="text-[13px] font-semibold text-[#111827]">
                    Shared Family Wallet Auto-Sync
                  </Text>
                </View>
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: "#e2e8f0", true: "#05bf78" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="h-[1px] bg-gray-100" />

              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => setIsShareModalVisible(true)}
                  className="flex-row items-center gap-3 flex-1 mr-2"
                >
                  <Text className="text-[17px]">📲</Text>
                  <View>
                    <Text className="text-[13px] font-semibold text-[#111827]">
                      Invite via Link & QR Code
                    </Text>
                    <Text className="text-[11px] text-[#05bf78] font-bold mt-0.5">
                      Tap to share or scan ›
                    </Text>
                  </View>
                </Pressable>
                <Switch
                  value={inviteViaQr}
                  onValueChange={setInviteViaQr}
                  trackColor={{ false: "#e2e8f0", true: "#05bf78" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleDeleteGroup}
            className="h-[50px] rounded-full items-center justify-center active:opacity-90 mt-2"
            style={{
              backgroundColor: "#ff6b6b",
              shadowColor: "#ff6b6b",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text className="text-white text-[15px] font-bold">
              Delete Family Group
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="settings" />

      <InviteMemberModal
        visible={isInviteModalVisible}
        onClose={() => setIsInviteModalVisible(false)}
        onInvite={handleInviteMember}
      />

      <EditMemberModal
        visible={editingMember !== null}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleUpdateMember}
        onRemove={handleRemoveMember}
      />

      <ShareInviteModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
      />
    </View>
  );
}
