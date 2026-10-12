import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Relationship } from "../types/models";

type Props = {
  visible: boolean;
  onClose: () => void;
  onInvite: (data: {
    name: string;
    relationship: Relationship;
    email: string;
    isFullAccess: boolean;
  }) => Promise<void>;
};

const RELATIONSHIPS: Relationship[] = ["Parent", "Child", "Other"];

export function InviteMemberModal({ visible, onClose, onInvite }: Props) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Other");
  const [email, setEmail] = useState("");
  const [isFullAccess, setIsFullAccess] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const isValid = name.trim().length > 0 && cleanEmail.includes("@");

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      setSubmitting(true);
      await onInvite({
        name: name.trim(),
        relationship,
        email: cleanEmail,
        isFullAccess,
      });
      setName("");
      setEmail("");
      setRelationship("Other");
      setIsFullAccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-[28px] p-6 gap-4 shadow-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-[#111827]">
              Invite Family Member
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-gray-400 font-bold text-[16px]">✕</Text>
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

          <View className="gap-1.5">
            <Text className="text-[12.5px] font-semibold text-[#374151]">
              Relationship
            </Text>
            <View className="flex-row gap-2">
              {RELATIONSHIPS.map((rel) => {
                const active = relationship === rel;
                return (
                  <Pressable
                    key={rel}
                    onPress={() => setRelationship(rel)}
                    className={`flex-1 h-[36px] rounded-full items-center justify-center border ${
                      active
                        ? "bg-[#05bf78] border-[#05bf78]"
                        : "bg-[#f8fafc] border-[#e1e5ea]"
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        active ? "text-white" : "text-[#475569]"
                      }`}
                    >
                      {rel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-[12.5px] font-semibold text-[#374151]">
              Email Address
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
            disabled={submitting || !isValid}
            className="h-[48px] rounded-full bg-[#05bf78] items-center justify-center flex-row gap-2 mt-1"
            style={{ opacity: submitting || !isValid ? 0.6 : 1 }}
          >
            {submitting && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-white font-bold text-[14px]">
              {submitting ? "Sending..." : "Send Invite"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
