import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  groupName?: string;
  inviteCode?: string;
};

export function ShareInviteModal({
  visible,
  onClose,
  groupName = "Family Workspace",
  inviteCode = "FAM-TRACK-2026",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `FamTrack Family Invite Code: ${inviteCode}`,
  )}&color=05bf78&bgcolor=ffffff&margin=1`;

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert("Copied", `Invite code: ${inviteCode}`);
    }
  };

  const handleShareInviteLink = async () => {
    try {
      const shareMessage = `Join our "${groupName}" on FamTrack!\n\nFamily Invite Code: ${inviteCode}\n\nUse this code or register with your invited email in FamTrack.`;

      const result = await Share.share({
        message: shareMessage,
        title: `Join ${groupName} on FamTrack`,
      });

      if (result.action === Share.sharedAction) {
        onClose();
      }
    } catch {
      await handleCopyCode();
      Alert.alert("Copied", "Share invite details copied to your clipboard!");
    }

  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="bg-white rounded-[28px] p-6 items-center gap-4 w-full max-w-[320px] shadow-2xl z-10">
          <Text className="text-[18px] font-bold text-[#111827]">
            Scan to Join Family
          </Text>
          <Text className="text-[12px] text-[#64748b] text-center">
            Scan this QR code with a phone camera or copy the invite code below.
          </Text>

          <View className="w-[180px] h-[180px] rounded-[22px] bg-white border-2 border-dashed border-[#05bf78] items-center justify-center p-2 relative">
            {qrLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color="#05bf78" />
              </View>
            )}
            <Image
              source={{ uri: qrCodeUrl }}
              style={{ width: 144, height: 144, borderRadius: 8 }}
              resizeMode="contain"
              onLoadEnd={() => setQrLoading(false)}
            />
          </View>

          <Pressable
            onPress={handleCopyCode}
            className="flex-row items-center gap-2 bg-[#e8f8f0] px-4 py-2 rounded-full border border-[#a7f3d0] active:opacity-80"
          >
            <Text
              className="text-[12.5px] font-bold text-[#00854b] tracking-wider"
              numberOfLines={1}
            >
              {inviteCode}
            </Text>
            <Text className="text-[11px] font-semibold text-[#00854b]">
              {copied ? "✓ Copied!" : "📋 Copy"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareInviteLink}
            className="w-full h-[46px] rounded-full bg-[#05bf78] items-center justify-center active:opacity-90 mt-1"
          >
            <Text className="text-white font-bold text-[14px]">
              Share Invite Code
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="py-1">
            <Text className="text-[#64748b] font-semibold text-[13px]">
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
