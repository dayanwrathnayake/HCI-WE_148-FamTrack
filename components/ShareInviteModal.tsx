import {
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
  groupName = "Perera Family",
  inviteCode = "PERERA-FAMILY-2026",
}: Props) {
  const handleShareInviteLink = async () => {
    try {
      await Share.share({
        message: `Join our ${groupName} Budget on FamTrack! Use invite code: ${inviteCode}\nClick here to join: https://famtrack.app/join/${inviteCode}`,
        title: `Join ${groupName} on FamTrack`,
      });
    } catch (error: any) {
      Alert.alert("Share Error", error.message);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://famtrack.app/join/${inviteCode}&color=05bf78&bgcolor=ffffff`;

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
            Have family members scan this QR code with their phone camera to
            join {groupName}.
          </Text>

          <View className="w-[180px] h-[180px] rounded-[20px] bg-white border-2 border-dashed border-[#05bf78] items-center justify-center p-3">
            <Image
              source={{ uri: qrCodeUrl }}
              style={{ width: 140, height: 140, borderRadius: 8 }}
              resizeMode="contain"
            />
            <Text className="text-[10px] font-bold text-[#05bf78] mt-1 tracking-wider">
              {inviteCode}
            </Text>
          </View>

          <Pressable
            onPress={handleShareInviteLink}
            className="w-full h-[46px] rounded-full bg-[#05bf78] items-center justify-center active:opacity-90"
          >
            <Text className="text-white font-bold text-[14px]">
              Share Invite Link
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
