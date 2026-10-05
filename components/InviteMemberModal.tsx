import { useState } from "react";
import { Modal, Pressable, Switch, Text, TextInput, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onInvite: (data: {
    name: string;
    role: string;
    email: string;
    isFullAccess: boolean;
  }) => void;
};

export function InviteMemberModal({ visible, onClose, onInvite }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Member");
  const [email, setEmail] = useState("");
  const [isFullAccess, setIsFullAccess] = useState(true);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onInvite({ name, role, email, isFullAccess });
    setName("");
    setEmail("");
    setRole("Member");
    setIsFullAccess(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-[28px] p-6 gap-4 shadow-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-[#111827]">
              Invite Family Member
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-gray-400 font-bold text-[15px]">✕</Text>
            </Pressable>
          </View>

          <View className="gap-1">
            <Text className="text-[12.5px] font-semibold text-[#374151]">
              Full Name
            </Text>
            <TextInput
              className="h-[46px] rounded-[12px] border border-[#e1e5ea] px-3.5 text-[14px]"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sarah Perera"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="gap-1">
            <Text className="text-[12.5px] font-semibold text-[#374151]">
              Relationship / Role
            </Text>
            <TextInput
              className="h-[46px] rounded-[12px] border border-[#e1e5ea] px-3.5 text-[14px]"
              value={role}
              onChangeText={setRole}
              placeholder="e.g. Sister, Brother, Daughter"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="gap-1">
            <Text className="text-[12.5px] font-semibold text-[#374151]">
              Email or Phone
            </Text>
            <TextInput
              className="h-[46px] rounded-[12px] border border-[#e1e5ea] px-3.5 text-[14px]"
              value={email}
              onChangeText={setEmail}
              placeholder="sarah@gmail.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="flex-row items-center justify-between py-2 border-t border-gray-100">
            <Text className="text-[13px] font-semibold text-[#111827]">
              Allow shared expense access
            </Text>
            <Switch
              value={isFullAccess}
              onValueChange={setIsFullAccess}
              trackColor={{ false: "#e2e8f0", true: "#05bf78" }}
              thumbColor="#ffffff"
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            className="h-[48px] rounded-full bg-[#05bf78] items-center justify-center mt-1"
          >
            <Text className="text-white font-bold text-[14px]">
              Send Invite
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
