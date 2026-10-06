import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { GroupMemberControl } from "../constants/group";

type Props = {
  visible: boolean;
  member: GroupMemberControl | null;
  onClose: () => void;
  onSave: (updatedMember: GroupMemberControl) => void;
  onRemove: (id: string) => void;
};

function EditMemberForm({
  member,
  onClose,
  onSave,
  onRemove,
}: {
  member: GroupMemberControl;
  onClose: () => void;
  onSave: (updatedMember: GroupMemberControl) => void;
  onRemove: (id: string) => void;
}) {
  const [role, setRole] = useState(member.roleDescription);
  const [isFullAccess, setIsFullAccess] = useState(
    member.accessType === "FULL ACCESS",
  );
  const [limitAmount, setLimitAmount] = useState("15000");

  const handleSave = () => {
    onSave({
      ...member,
      roleDescription: role,
      accessType: isFullAccess ? "FULL ACCESS" : "LIMITED",
      limitText: isFullAccess
        ? undefined
        : `LIMIT: RS ${Number(limitAmount || 0).toLocaleString("en-US")}/MO`,
    });
    onClose();
  };

  return (
    <View className="bg-white rounded-t-[28px] p-6 gap-5 shadow-xl">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Image
            source={member.avatar}
            style={{ width: 44, height: 44, borderRadius: 22 }}
            resizeMode="cover"
          />
          <View>
            <Text className="text-[17px] font-bold text-[#111827]">
              {member.name}
            </Text>
            <Text className="text-[12px] text-[#64748b]">
              {member.email || "Family Member"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          className="h-[30px] w-[30px] rounded-full bg-gray-100 items-center justify-center"
          hitSlop={8}
        >
          <Text className="text-gray-500 font-bold text-[14px]">✕</Text>
        </Pressable>
      </View>

      <View className="gap-1.5">
        <Text className="text-[13px] font-semibold text-[#1f2937]">
          Relationship / Role
        </Text>
        <TextInput
          className="h-[46px] rounded-[12px] border border-[#e1e5ea] px-3.5 text-[14px] text-[#111827]"
          value={role}
          onChangeText={setRole}
          placeholder="e.g. Mom, Son, Daughter"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="flex-row items-center justify-between py-2 border-t border-b border-gray-100">
        <View className="flex-1 mr-3">
          <Text className="text-[14px] font-bold text-[#111827]">
            Full Access (No Allowance Limit)
          </Text>
          <Text className="text-[11px] text-[#64748b] mt-0.5">
            Member can spend without monthly restrictions
          </Text>
        </View>
        <Switch
          value={isFullAccess}
          onValueChange={setIsFullAccess}
          trackColor={{ false: "#e2e8f0", true: "#05bf78" }}
          thumbColor="#ffffff"
        />
      </View>

      {!isFullAccess && (
        <View className="gap-1.5">
          <Text className="text-[13px] font-semibold text-[#1f2937]">
            Monthly Spending Limit (RS)
          </Text>
          <TextInput
            className="h-[46px] rounded-[12px] border border-[#e1e5ea] px-3.5 text-[14px] text-[#111827]"
            value={limitAmount}
            onChangeText={(t) => setLimitAmount(t.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            placeholder="15,000"
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}

      <View className="flex-row gap-3 mt-2">
        <Pressable
          onPress={() => {
            onRemove(member.id);
            onClose();
          }}
          className="flex-1 h-[48px] rounded-full items-center justify-center bg-red-50 border border-red-200"
        >
          <Text className="text-[14px] font-bold text-red-600">Remove</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          className="flex-[1.4] h-[48px] rounded-full items-center justify-center bg-[#05bf78]"
        >
          <Text className="text-[14px] font-bold text-white">Save Changes</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EditMemberModal({
  visible,
  member,
  onClose,
  onSave,
  onRemove,
}: Props) {
  return (
    <Modal
      visible={visible && member !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        {member && (
          <EditMemberForm
            key={member.id}
            member={member}
            onClose={onClose}
            onSave={onSave}
            onRemove={onRemove}
          />
        )}
      </View>
    </Modal>
  );
}
