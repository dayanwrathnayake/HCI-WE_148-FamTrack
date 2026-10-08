import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { MemberInitialsAvatar } from "../components/MemberInitialsAvatar";
import { ShareInviteModal } from "../components/ShareInviteModal";
import { useFamily } from "../context/FamilyContext";
import { getInviteErrorMessage } from "../services/familyService";
import { getAvatarPalette, getInitials, MemberRecord } from "../utils/members";

export default function ManageGroupScreen() {
  const { family, members, isAdmin, inviteMember, removeMember, status } =
    useFamily();

  const [autoSync, setAutoSync] = useState(true);
  const [inviteViaQr, setInviteViaQr] = useState(true);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(
    null,
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleInvite = async (data: {
    name: string;
    relationship: any;
    email: string;
    isFullAccess: boolean;
  }) => {
    try {
      await inviteMember({
        name: data.name,
        relationship: data.relationship,
        contact: data.email,
        canAddExpenses: data.isFullAccess,
      });
      setIsInviteModalVisible(false);
      Alert.alert(
        "Invitation Sent",
        `An invitation has been created for ${data.name} (${data.email})!`,
      );
    } catch (error: any) {
      Alert.alert("Invite Error", getInviteErrorMessage(error));
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Family Group",
      "Are you sure you want to delete this family group? All shared budgets and members will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Group",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Info",
              "Only the family creator can delete the family workspace.",
            );
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
          contentContainerStyle={{ padding: 20, paddingBottom: 50, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <GroupAdminCard />

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#111827]">
                Family Members ({members.length})
              </Text>

              {isAdmin && (
                <Pressable
                  onPress={() => setIsInviteModalVisible(true)}
                  hitSlop={6}
                >
                  <Text className="text-[13px] font-bold text-[#05bf78]">
                    + Invite
                  </Text>
                </Pressable>
              )}
            </View>

            {status === "loading" ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#05bf78" />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingHorizontal: 2 }}
                className="py-1"
              >
                {members.map((m) => {
                  const palette = getAvatarPalette(m.id);
                  const initials = getInitials(m.displayName);

                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setSelectedMember(m)}
                      className="items-center gap-1.5"
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                    >
                      <MemberInitialsAvatar
                        initials={initials}
                        backgroundColor={palette.background}
                        textColor={palette.text}
                        size={48}
                      />
                      <Text
                        className="text-[12px] font-semibold text-[#111827] max-w-[64px]"
                        numberOfLines={1}
                      >
                        {m.displayName.split(" ")[0]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
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
                className="bg-white rounded-[22px] px-4 py-2 shadow-sm shadow-black/5 elevation-1"
                style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
              >
                {members.map((m, index) => (
                  <MemberControlRow
                    key={m.id}
                    member={m}
                    isLast={index === members.length - 1}
                    onPress={() => setSelectedMember(m)}
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

          {isAdmin && (
            <Pressable
              onPress={handleDeleteGroup}
              className="h-[50px] rounded-full items-center justify-center mt-2"
              style={({ pressed }) => ({
                backgroundColor: "#ff6b6b",
                shadowColor: "#ff6b6b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text className="text-white text-[15px] font-bold">
                Delete Family Group
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="settings" />

      <InviteMemberModal
        visible={isInviteModalVisible}
        onClose={() => setIsInviteModalVisible(false)}
        onInvite={handleInvite}
      />

      <EditMemberModal
        visible={selectedMember !== null}
        member={selectedMember}
        isAdmin={isAdmin}
        onClose={() => setSelectedMember(null)}
        onRemove={async (member) => {
          await removeMember(member.id, member.inviteEmail);
          setSelectedMember(null);
          Alert.alert(
            "Success",
            member.status === "pending"
              ? `Invitation for ${member.displayName} has been cancelled.`
              : `${member.displayName} has been removed from the family.`,
          );
        }}
      />

      <ShareInviteModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        groupName={family?.name || "Family Group"}
        inviteCode={family?.id || "FAM-TRACK-2026"}
      />
    </View>
  );
}
